window.addEventListener('load', function() {
	
	// Parse the query string into a key/value object
	var query = {};
	location.search.replace( /[A-Z0-9]+?=(\w*)/gi, function(a) {
		query[ a.split( '=' ).shift() ] = a.split( '=' ).pop();
	} );

	// Start Reveal.js Slideshow Engine
	Reveal.initialize({
		// Display controls in the bottom right corner
		controls: true,

		// Display a presentation progress bar
		progress: true,

		// If true; each slide will be pushed to the browser history
		history: true,

		// Flags if mouse wheel navigation should be enabled
		mouseWheel: false,

		// Apply a 3D roll to links on hover
		rollingLinks: false,

		// UI style
		theme: query.theme || 'default', // default/neon

		// Transition style
		transition: query.transition || 'default' // default/cube/page/concave/linear(2d)
	});

	// Don't reveal fragments if not on wmd.slidedeck (easier for students to study)
	if (window.location.host != 'wmd.slidedeck') {
		var fragments = document.querySelectorAll('.fragment');
		for (var i = 0, len = fragments.length; i < len ; i++) {
			var fcl = fragments[i].classList;
			if (!fcl.contains('dontunfragment')) {
				fcl.add('visible');
				fcl.remove('fragment');
			}
		}
	}

	// Fetch TOC
	var mainSections = document.querySelectorAll('.slides > section');
	var chapterTitle = document.querySelector('h1').innerText;
	var toc = [];
	for (var i = 1, len = mainSections.length; i < len ; i++) {

		// Get shorthand to section element
		var mainSection = mainSections[i];

		// Give secion an id. This to byspass the fact that querySelectorAll later on is root based
		if (!mainSection.id) mainSection.id = 'toc_slide_' + i;

		// Get subSections
		var subSections = document.querySelectorAll('#' + mainSection.id + ' > section');

		var subSlides = [];
		if (subSections.length) {
			for (var j = 2, leng = subSections.length; j <= leng ; j++) {
				var subTitleEl = document.querySelector('#' + mainSection.id + ' > section:nth-child(' + (j) + ') > h2');
				if (subTitleEl) {
					subSlides.push({
						num: i + '/' + (j-1),
						title: subTitleEl.innerText || subTitleEl.innerHTML,
					});
				}
			}
		}

		toc.push({
			num : i,
			title: document.querySelector('#' + mainSection.id + ' > section > h2').innerText || document.querySelector('#' + mainSection.id + ' > section > h2').innerHTML,
			subSlides : subSlides
		});
	}

	// Build TOC and Overwrite backlink
	var tocHTML = '<nav><p>Slides Navigator</p><ul><li><a href="index.html">&larr; Back to index</a></li></ul>';
	if (toc.length) {
		tocHTML += '<ul>';
		for (var i = 0, l = toc.length; i < l; i++) {
			var mainSection = toc[i];
			tocHTML += '<li><a href="#/' + mainSection.num + '">' + mainSection.title + '</a>';
			if (mainSection.subSlides.length) {
				tocHTML += '<ul>';
				for (var j = 0, k = mainSection.subSlides.length; j < k; j++) {
					var subSection = mainSection.subSlides[j];
					tocHTML += '<li><a href="#/' + subSection.num + '">' + subSection.title + '</a><span class="pagenr">' + subSection.num + '</span></li>';
				}
				tocHTML += '</ul>';
			}
			tocHTML += '</li>';
		}
		tocHTML += '</ul>';
	}
	document.querySelector('.back').innerHTML = tocHTML;



	// Syntax Highlighting (all code blocks: JS, CSS, HTML, PHP, etc.) + play nice contenteditable
	var codeBlocks = document.querySelectorAll('pre code');
	for (var i = 0, len = codeBlocks.length; i < len ; i++) {

		// Local reference
		var codeBlock = codeBlocks[i];

		// May we highlight it?
		if (codeBlock.className.match(new RegExp('(\\s|^)donthighlight(\\s|$)'))) continue;

		// Highlight it
		hljs.highlightBlock(codeBlock, '    ');
		
		// If it's editable, add listeners to it to disable/enable Syntax Highlighting when necessary
		if (codeBlock.hasAttribute('contenteditable')) {
			
			// Disable on focus
			codeBlock.addEventListener('focus', function() {
				if (this.className.match(new RegExp('(\\s|^)language-html(\\s|$)')) || this.className.match(new RegExp('(\\s|^)language-php(\\s|$)'))) {
					this.innerHTML = htmlentities(stripHTML(this.innerHTML));
				} else {
					this.innerHTML = stripHTML(this.innerHTML);
				}
			});
		
			// Re-enable on blur
			codeBlock.addEventListener('blur', function() {
				// @note <div> is needed for Chrome which inserts one when ENTER is pressed.
				this.innerHTML = this.innerHTML.replace(/<br>/gm, '\r\n').replace(/<br\/>/gm, '\r\n').replace(/<br \/>/gm, '\r\n').replace(/<div>/gm, '\r\n').replace(/<\/div>/gm, ''); 
				hljs.highlightBlock(this, '    ');
			});
			
		}
		
		// linked examples
		if (codeBlock.hasAttribute('data-overlay-example')) {

			// Add Show Example button
			var button = document.createElement('input');
			button.type = 'submit';
			button.value = 'Show Example';
			button.className = 'run';
			button.addEventListener('click', function() {
				showInOverlay(this.parentNode.querySelector('code'), null, this.parentNode.querySelector('code').getAttribute('data-overlay-example'));
			});
			codeBlock.parentNode.appendChild(button);
			
		}
		
	}

	// Add Run Button to JS Blocks + Make Incrementable
	var jsBlocks = document.querySelectorAll('code.language-javascript');
	for (var i = 0, len = jsBlocks.length; i < len ; i++) {

		// Local reference
		var jsBlock = jsBlocks[i];

		// may we add the run button to it?
		if (jsBlock.className.match(new RegExp('(\\s|^)dontrun(\\s|$)'))) continue;

		// Add Run button
		var button = document.createElement('input');
		button.type = 'submit';
		button.value = 'Run';
		button.className = 'run';
		button.addEventListener('click', function() {
			eval(stripHTML(this.parentNode.querySelector('code').innerHTML)); // Yeah, that's effin' dangerous!
		});
		jsBlock.parentNode.appendChild(button);

		// Hook ctrl+enter to run the code
		jsBlock.addEventListener('keypress', function(evt) {
			if(evt.ctrlKey && (evt.keyCode == 13)) {
				evt.preventDefault();
				evt.stopPropagation();
				eval(stripHTML(this.innerHTML));
			}
		}, false);

		// Make Incrementable
		new Incrementable(jsBlock);

	}

	// Helper Function to strip HTML from a string
	function stripHTML(html) {
		var tmp = document.createElement('div');
		tmp.innerHTML = html;
		toReturn = tmp.textContent || tmp.innerText;
		tmp = null;
		return toReturn;
	}
	
	function htmlentities(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML.replace(/"/g, '"').replace(/'/g, '\'');
	}
	
	function html_entity_decode(str) {
		var tmp = document.createElement('textarea');
		tmp.innerHTML = str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
		toReturn = tmp.value;
		tmp = null;
		return toReturn;
	}

	// Make CSS Blocks update referenced elements + Make Incrementable
	var cssBlocks = document.querySelectorAll('code.language-css');
	for(var i = 0, len = cssBlocks.length; i < len; i++) {

		// Local reference
		var cssBlock = cssBlocks[i];

		// Apply style to referenced element(s)
		new CSSSnippet(cssBlock);

		// Make Incrementable
		new Incrementable(cssBlock);
		
	}

	// Add Show in Overlay Button to HTML Blocks
	var htmlBlocks = document.querySelectorAll('code.language-html');
	for (var i = 0, len = htmlBlocks.length; i < len ; i++) {

		// Local reference
		var htmlBlock = htmlBlocks[i];

		// may we add the run button to it?
		if (htmlBlock.className.match(new RegExp('(\\s|^)dontrun(\\s|$)'))) continue;

		// Add Run button
		var button = document.createElement('input');
		button.type = 'submit';
		button.value = 'Show in overlay';
		button.className = 'run';
		button.addEventListener('click', function() {
			var codeBlock = this.parentNode.querySelector('code');
			showInOverlay(codeBlock, htmlentities(stripHTML(codeBlock.innerHTML)));
		});
		htmlBlock.parentNode.appendChild(button);

		// Hook ctrl+enter to run the code
		htmlBlock.addEventListener('keypress', function(evt) {
			if(evt.ctrlKey && (evt.keyCode == 13)) {
				evt.preventDefault();
				evt.stopPropagation();
				showInOverlay(this, this.innerHTML);
			}
		}, false);

	}
	
	// show a blob of HTML inside an overlay
	var showInOverlay = function(codeBlock, html, url) {
		
		codeBlock.blur();
		
		var height = parseInt(codeBlock.getAttribute('data-overlay-height') || 460, 10);
		var width = parseInt(codeBlock.getAttribute('data-overlay-width') || 680, 10);
		var url = url || 'assets/blank.html';
		
		// Make sure overlay UI elements are present
		if (!document.getElementById('overlayBack')) {
			var overlayBack = document.createElement('div');
			overlayBack.id = "overlayBack";
			overlayBack.addEventListener('click', function(e) {
				e.stopPropagation();
				
				// erase contents (to prevent movies from playing int he back for example)
				document.getElementById('daframe').src= 'assets/blank.html';
				
				// hide
				document.getElementById('overlayBack').style.display = 'none';
				document.getElementById('overlayContent').style.display = 'none';
			});
			document.body.appendChild(overlayBack);
		}

		if (!document.getElementById('overlayContent')) {
			var overlayContent = document.createElement('div');
			overlayContent.id = "overlayContent";
			document.body.appendChild(overlayContent);
		}
		
		// reference elements we'll be needing
		var ob = document.getElementById('overlayBack');
		var oc = document.getElementById('overlayContent');
		
		// Position oc
		oc.style.width = width + 'px';
		oc.style.height = height + 'px';
		oc.style.marginTop = '-' + (height/2) + 'px';
		oc.style.marginLeft = '-' + (width/2) + 'px';
		
		// inject iframe
		oc.innerHTML = '<iframe src="' + url + '" height="' + height + '" width="' + width + '" border="0" id="daframe"></iframe>';
		
		// inject HTML
		if (html) {
			var oIframe = document.getElementById('daframe');
			var oDoc = (oIframe.contentWindow || oIframe.contentDocument);
			if (oDoc.document) oDoc = oDoc.document;
			oDoc.write(html_entity_decode(html));
		}
		
		// Show me the money!
		ob.style.display = 'block';
		oc.style.display = 'block';
		
	}
	
	// Print fix (Firefox, IE only though)
	window.addEventListener('beforeprint', function(e) {
		
		// unhide all slides
		var els = document.querySelectorAll('#reveal .slides > section');
		for(var i = 0, len = els.length; i < len; i++) {
			els[i].style.display = 'block';
		}
		
		// hide overlay
		document.getElementById('overlayBack').style.display = 'none';
		document.getElementById('overlayContent').style.display = 'none';
	});
	
}, false);