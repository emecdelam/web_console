// ==UserScript==
// @name         Console
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Integrated console for custom command, usefull when there is no access to the default console
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function(){
  'use strict';
  // Variables
  let dragging = false;
  let xOffset = 0;
  let yOffset = 0;
  let consoleElement;
  let consoleHistory = [];




    function deleteConsole(id) {
      const consoleElement = document.getElementById(id);
      if (consoleElement) {
        consoleElement.remove();
      }
    }
    function createConsole(x, y, id, maxLines) {
      var commandDic = {
        'help':{func:help},
        'del':{func:del,desc:'deletes the console'},
        'rel':{func:reloadPage},
        'find':{func:find},
        'url':{func:url},
        'fs':{func:fullscreen},
        'dim':{func:windowdimensions},
        'new':{func:newConsole},
        'clear':{func:clearConsole}
      };
      const consoleElement = document.createElement('div');
      consoleElement.style.position = 'fixed';
      consoleElement.style.left = `${x}px`;
      consoleElement.style.top = `${y}px`;
      consoleElement.style.width = '400px';
      consoleElement.style.height = `${50*maxLines}px`;
      consoleElement.style.backgroundColor = 'black';
      consoleElement.style.color = 'white';
      consoleElement.style.overflow = 'hidden';
      consoleElement.style.fontFamily = 'cascadia code';
      consoleElement.style.fontSize = '14px';
      consoleElement.style.whiteSpace = 'pre'; // To preserve line breaks and spacing
      consoleElement.style.padding = '5px';
      consoleElement.style.boxSizing = 'border-box';
      consoleElement.style.border = '2px solid white';
      consoleElement.style.borderRadius = '5px';
      consoleElement.id = id;
      consoleElement.style.zIndex = '9999';
      consoleElement.addEventListener('mousedown', (event) => {
          dragging = true;
          xOffset = event.clientX - consoleElement.offsetLeft;
          yOffset = event.clientY - consoleElement.offsetTop;
        });

        document.addEventListener('mousemove', (event) => {
          if (dragging) {
            const x = event.clientX - xOffset;
            const y = event.clientY - yOffset;
            consoleElement.style.left = `${x}px`;
            consoleElement.style.top = `${y}px`;
          }
        });

        document.addEventListener('mouseup', () => {
          dragging = false;
        });




      const outputElement = document.createElement('div');
      outputElement.style.height = 'calc(100% - 60px)'; // Allow some space for the input bar
      outputElement.style.overflowY = 'auto';
      outputElement.id = 'outputElement';

      const inputBar = document.createElement('div');
      inputBar.style.height = '30px';
      inputBar.style.borderTop = '1px solid white';
      inputBar.style.display = 'flex';
      inputBar.style.alignItems = 'center';
      inputBar.style.marginTop = '5px'; // Add some space between the output container and the input container

      const whiteSpaceTop = document.createElement('div');
      whiteSpaceTop.style.height = '10px'; // Add space between the upper text and the upper border

      const whiteSpaceBottom = document.createElement('div');
      whiteSpaceBottom.style.height = '10px'; // Add space between the separation bar and the written text

      const inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.style.width = '100%';
      inputElement.style.boxSizing = 'border-box';
      inputElement.style.border = 'none';
      inputElement.style.backgroundColor = 'transparent';
      inputElement.style.outline = 'none';
      inputElement.style.color = 'white';
      inputElement.style.fontFamily = 'cascadia code';
      inputElement.style.fontSize = '14px';
      inputElement.style.margin = '0';
      inputElement.style.padding = '0';
      inputElement.placeholder = 'Type a command here...';
      consoleElement.appendChild(outputElement);
      consoleElement.appendChild(whiteSpaceTop);
      consoleElement.appendChild(inputBar);
      consoleElement.appendChild(whiteSpaceBottom);

      inputBar.appendChild(inputElement);

      document.body.appendChild(consoleElement);




        // Here goes console functions
        function print(text) {
          return text;
        }
        function del(){
          handleToggleConsoleSwitch();
          setSwitchOff()
        }
        function newConsole(){
          handleToggleConsoleSwitch();
          handleToggleConsoleSwitch();
        }
        function clearConsole(){
         consoleHistory = [];
         outputElement.innerHTML = '';
         return 'Console cleared';
        }
        function help() {
          let helpMessage = 'Available commands:\n';

          for (const command in commandDic) {
            const description = commandDic[command].desc;
            if (description) {
              helpMessage += `${command} : ${description}\n`;
            }
          }

          return helpMessage;
        }
        function reloadPage(){
          location.reload();
        }
        function find(word) {
          const results = [];
          const processedElements = new Set();
          function hasClass(element, word) {
            const classNames = element.getAttribute('class') || '';
            return classNames.split(' ').some(className => className.toLowerCase().includes(word.toLowerCase()));
          }

          function traverse(element, results) {
            if (processedElements.has(element)) {
              return; // Skip if the element has been processed already
            }
            processedElements.add(element);
            if (element.nodeType === Node.TEXT_NODE) {
              const textContent = element.textContent.trim();
              if (textContent.toLowerCase().includes(word.toLowerCase())) {
                const parentElement = element.parentElement;
                const elementInfo = {
                  type: 'text',
                  text: textContent,
                  classList: Array.from(parentElement.classList),
                };
                results.push(elementInfo);
              }
            } else if (element.nodeType === Node.ELEMENT_NODE) {
              if (hasClass(element, word)) {
                results.push({
                  type: 'element',
                  tagName: element.tagName.toLowerCase(),
                  classList: Array.from(element.classList),
                });
              }
              if (element.tagName.toLowerCase() === 'a' && element.href.includes(word.toLowerCase())) {
                results.push({
                  type: 'link',
                  text: element.textContent.trim(),
                  href: element.href,
                  classList: Array.from(element.classList),
                });
              } else if (/^h\d$/i.test(element.tagName) && element.textContent.toLowerCase().includes(word.toLowerCase())) {
                results.push({
                  type: 'header',
                  text: element.textContent.trim(),
                  classList: Array.from(element.classList),
                });
              }
            }

            const children = element.childNodes;
            for (const child of children) {
              traverse(child, results);
            }
          }

          traverse(document.body, results, processedElements);
          return results.length > 0 ? results : 'No results found';
          }

        function url(){
          const url = window.location.href;
          navigator.clipboard.writeText(url);
          return 'Url copied';
        }
        function windowdimensions(){
          return `width : ${window.innerWidth}, heigth : ${window.innerHeight}`
        }
        function fullscreen(){
          if (!document.fullscreenElement && !document.webkitFullscreenElement &&
            !document.mozFullScreenElement && !document.msFullscreenElement) {
          // If the document is not in fullscreen mode, request to enter fullscreen
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.mozRequestFullScreen) { // Firefox
            document.documentElement.mozRequestFullScreen();
          } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari, and Opera
            document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
          }
        } else {
          // If the document is already in fullscreen mode, exit fullscreen
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) { // Chrome, Safari, and Opera
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
          }
        }
        return 'Done';
        }




        function displayOutput(text) {
          if (text != ''){
          const outputLine = document.createElement('div');
          outputLine.textContent = text;
          outputElement.appendChild(outputLine);
          consoleHistory.push(outputLine);
          }
          else{
          const emptyLine = document.createElement('br');
          outputElement.appendChild(emptyLine);

          outputElement.scrollTop = outputElement.scrollHeight;}
        }

        function formatResult(results) {
          if (typeof results === 'string'){
            return results;
          }
          if (!Array.isArray(results) || results.length === 0) {
            return undefined;
          }

          let formattedResult = '';
          for (const result of results) {
            const type = result.type;
            if (type === 'text') {
              formattedResult += `Type: Text\nContent: ${result.text}\nClass: ${result.classList.join(', ')}\n\n`;
            } else if (type === 'element') {
              formattedResult += `Type: Element\nTag: ${result.tagName}\nClass: ${result.classList.join(', ')}\n\n`;
            } else if (type === 'link') {
              formattedResult += `Type: Link\nContent: ${result.text}\nClass: ${result.classList.join(', ')}\nHref: ${result.href}\n\n`;
            } else if (type === 'header') {
              formattedResult += `Type: Header\nContent: ${result.text}\nClass: ${result.classList.join(', ')}\n\n`;
            }
          }

          formattedResult += `Number of results: ${results.length}\n\n`;

          return formattedResult.trim();
        }

        inputElement.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.stopPropagation();
            const command = inputElement.value;
            inputElement.value = '';
            let result = undefined;
            displayOutput(`> ${command} :`);
            try {
              const [commandName, ...params] = command.split(' ');
              if (commandName in commandDic) {
                const { func } = commandDic[commandName];
                if (params.length > 0) {
                  result = func(...params);
                } else {
                  result = func();
                }
              } else {
                result = eval(command);
              }

              const formattedResult = formatResult(result);
              if (formattedResult !== undefined) {
                displayOutput(`${formattedResult}`);
                displayOutput('')
              }
            } catch (error) {
              displayOutput(`${error}`);
            }
          }
        });
      inputElement.focus();
    }



    function printMessage(message){
      outputElement = document.getElementById('outputElement');
      const outputLine = document.createElement('div');
      outputLine.textContent = message;
      outputElement.appendChild(outputLine);

      consoleHistory.push(outputLine);

      outputElement.scrollTop = outputElement.scrollHeight;
    }


  // Handle click functions

  function setSwitchOff(){
    const checkbox = document.getElementById('console-checkbox');
  checkbox.checked = !checkbox.checked;
  }
  function handleToggleConsoleSwitch() {
    const consoleElement = document.getElementById('console');
    console.log('toggle console');

    if (consoleElement) {
      console.log('there is a console');
      consoleElement.remove();
    } else {
      console.log('clicking');
      createConsole(10, 50, 'console', 7);
    }
  }

  const switchContainer = document.createElement('label');
  switchContainer.classList.add('switch');
  switchContainer.style.position = 'fixed';
  switchContainer.style.left = '10px';
  switchContainer.style.top = '10px';
  switchContainer.style.zIndex = '9999';
  switchContainer.id = 'console-switch-container';
  switchContainer.innerHTML = `
      <input type="checkbox" id="console-checkbox" class="switch-checkbox">
      <span class="slider"></span>
  `;
  // Attach the event listener to the checkbox, not the container
  const checkbox = switchContainer.querySelector('#console-checkbox');
  checkbox.addEventListener('click', handleToggleConsoleSwitch);

  const style = document.createElement('style');
  style.textContent = `
      .switch {
          position: relative;
          display: inline-block;
          width: 30px; /* Reduced width */
          height: 17px; /* Reduced height */
      }

      /* Hide default HTML checkbox */
      .switch input {
          opacity: 0;
          width: 0;
          height: 0;
      }

      /* The slider */
      .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #a83a32;
          transition: .4s;
          border-radius: 17px; /* Reduced border-radius */
      }

      .slider:before {
          position: absolute;
          content: "";
          height: 13px; /* Reduced height */
          width: 13px; /* Reduced width */
          left: 2px; /* Adjusted position */
          bottom: 2px; /* Adjusted position */
          background-color: white;
          transition: .4s;
          border-radius: 50%;
      }

      .switch input:checked + .slider {
          background-color: #32a84a;
      }

      .switch input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
      }

      .switch input:checked + .slider:before {
          transform: translateX(13px); /* Adjusted translation */
      }
  `;
  document.head.appendChild(style);
  document.body.appendChild(switchContainer);
})();
