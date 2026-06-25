// DISCLOSURE: ai written pretty much
const { JSDOM } = require('jsdom');
const htmlCharacterReferenceNames = require("../resources/html-character-reference-names.json");

const fixReferenceNames = (svgString) => {
    // Regex matches an ampersand followed by alphanumeric characters, 
    // ending with a semicolon.
    const entityRegex = /&([a-zA-Z0-9#]+);/g;

    // The whitelist of standard XML/HTML entities
    const whitelist = new Set(['amp', 'lt', 'gt', 'apos', 'quot']);

    return svgString.replace(entityRegex, (match, entityName) => {
        // If it's in the whitelist, keep the original match
        if (whitelist.has(entityName.toLowerCase())) {
            return match;
        }

        // Otherwise, treat it as a literal string (or remove it/log it)
        // Here we escape the & to prevent it from being parsed as an entity
        const object = htmlCharacterReferenceNames[`&${entityName.toLowerCase()}`];
        if (!object) return "";
        return object.characters || "";
    });
};

const parseViewbox = (viewBox) => {
    const parts = viewBox
        .trim()
        .split(/[\s,]+/)
        .map(unit => Number(unit || "0"))
        .map(num => (isNaN(num) || !isFinite(num)) ? 0 : num);
    return parts;
};

/**
 * A loose SVG repair that fixes through JSDOM
 * Intended to repair:
 * 
 * - cases where the svg starts with non-svg text (ie, "Here is your svg:")
 * - cases where the svg starts with non-svg text AND that text contains HTML/SVG tags (ie, "Here is your svg using `<image>` elements:")
 * - cases where the svg is encased in a code-block (ie, "```svg <svg>...")
 * - cases where the svg starts with non <svg> (ie, "```svg <rect>...")
 * - Malformed SVG in general
 * 
 * @param {string} text the svg to fix
 * @returns {string} the svg
 */
const repairSvg = (rawSvgString) => {
    let trimmed = `${rawSvgString}`.trim();
    // If a markdown comment was included, it likely marks the start of the SVG
    // We should still trim it out, but this helps prevent cases where the AI mentions tags before the svg actually starts
    const codeBlockStart = trimmed.search(/```\s*\w+?\s*/i);
    if (codeBlockStart !== -1) {
        trimmed = trimmed.slice(codeBlockStart);

        // Remove common Markdown code block prefixes like ```json or ````
        trimmed = trimmed.replace(/^```\s*\w+?\s*/i, "");
        trimmed = trimmed.trim();
        trimmed = trimmed.replace(/^```/i, "");
    }

    let clean = trimmed.replace(/[^\x00-\x7F]/g, "");
    // Find the first opening symbol that likely starts the SVG payload
    const svgStart = clean.search(/[<]/);
    if (svgStart !== -1) {
        clean = clean.slice(svgStart);
    }

    // NOTE: MAKE THE DOM WITH HTML BECAUSE LENIENT PARSER
    const dom = new JSDOM(clean, { contentType: "text/html" });
    const doc = dom.window.document;

    // Remove comments that are invalid -- Create a TreeWalker to find only Comment nodes
    const walker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_COMMENT, null);
    // Iterate through all found comments and update their content
    let currentNode;
    while (currentNode = walker.nextNode()) {
        currentNode.textContent = `${currentNode.textContent}`.replace(/[^a-z0-9_\s\.*]/gi, "");
    }

    // Remove invalid entities (anything that is not &amp;, &lt;, &gt;, &apos;, and &quot;)
    // Iterate through all text nodes using TreeWalker
    const walker2 = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT, null);
    while (currentNode = walker.nextNode()) {
        // If you need to ensure ALL named entities are converted to their 
        // literal characters, JSDOM's .textContent property is already your best friend.
        // It provides the "raw" character value.
        currentNode.textContent = currentNode.textContent.replace(/\u00A0/g, ' ');
        // Add other replacements here if your SVG library is sensitive to specific characters
    }

    // From here on, we setup a panic return incase we do something that causes an error (because these tasks may NOT be important)
    const panicReturn = () => {
        const svg = doc.querySelector('svg');
        if (svg) return fixReferenceNames(svg.outerHTML);
        const img = doc.querySelector('image');
        if (img) return fixReferenceNames(img.outerHTML);
        const root = doc.body.firstElementChild || doc.firstElementChild;
        return fixReferenceNames(root ? root.outerHTML : "");
    };

    try {
        let svgElement = doc.querySelector('svg');

        // 1. Wrap or Convert if not <svg>
        if (!svgElement) {
            const first = doc.body.firstElementChild;
            if (first) {
                // If it's already an SVG, just grab it, otherwise wrap in new SVG
                if (first.tagName.toLowerCase() === 'svg') {
                    svgElement = first;
                } else {
                    svgElement = doc.createElement('svg');
                    // Move existing content into the new SVG instead of double-nesting
                    while (doc.body.firstChild) {
                        svgElement.appendChild(doc.body.firstChild);
                    }
                    doc.body.appendChild(svgElement);
                }
            } else {
                return panicReturn();
            }
        }

        // 2. Ensure xmlns
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // 3. Ensure width & height AND OR viewBox
        const defaultWidth = 100;
        const defaultHeight = 100;
        // if we have a viewbox we can make width & height from
        if (svgElement.hasAttribute('viewBox') && (!svgElement.hasAttribute("width") || !svgElement.hasAttribute("height"))) {
            const viewBox = parseViewbox(svgElement.getAttribute("viewBox"));
            if (!svgElement.hasAttribute("width")) {
                svgElement.setAttribute('width', `${typeof viewBox[2] === "number" ? viewBox[2] : defaultWidth}px`);
            }
            if (!svgElement.hasAttribute("height")) {
                svgElement.setAttribute('height', `${typeof viewBox[3] === "number" ? viewBox[3] : defaultHeight}px`);
            }
        }
        // if the last check didnt happen, we use default width & height here
        // NOTE: We standardize width & height to mean the *literal* pixel size to render the svg at (since we assume standalone SVG, no parent container)
        let width = parseFloat(svgElement.getAttribute('width') || defaultWidth) || defaultWidth;
        let height = parseFloat(svgElement.getAttribute('height') || defaultHeight) || defaultHeight;
        width = Math.max(1, width);
        height = Math.max(1, height);
        
        // clamp width & height to a safe value without ruining aspect ratio
        const aspectRatio = width / height;
        let newWidth = Math.min(Math.max(1, width), 8192);
        let newHeight = Math.min(Math.max(1, height), 8192);
        if (newWidth / newHeight > aspectRatio) {
            newWidth = Math.round(newHeight * aspectRatio);
        } else {
            newHeight = Math.round(newWidth / aspectRatio);
        }

        width = newWidth;
        height = newHeight;
        svgElement.setAttribute('width', `${width}px`);
        svgElement.setAttribute('height', `${height}px`);

        // 4. ensure the viewbox is proper 
        // NOTE: we dont have to clamp or round viewBox since width & height declare the real pixel size (in standalone SVG at least)
        if (!svgElement.hasAttribute('viewBox')) {
            // this will always be a proper viewbox
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        } else {
            const viewBox = parseViewbox(svgElement.getAttribute("viewBox"));
            if (viewBox.length > 4) viewBox.splice(4, Infinity);
            while (viewBox.length < 2) viewBox.push(0);
            if (viewBox.length === 2) viewBox.push(width);
            if (viewBox.length === 3) viewBox.push(height);
            svgElement.setAttribute('viewBox', viewBox.join(' '));
        }

        // 5. Add background rect if requested (gemma4 likes to do this, which works in browser(?) but not other environments)
        const bgColor = svgElement.style?.background || svgElement.style.backgroundColor;
        if (bgColor) {
            const rect = doc.createElement('rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', bgColor);
            // Insert as the first element so it renders behind everything else
            svgElement.insertBefore(rect, svgElement.firstChild);
        }

        // TODO: Need to fix the following:
        // - Opening and ending tag mismatch: svg line (X) and (X)
        // - invalid properties/values set on certain svg elements

        return fixReferenceNames(svgElement.outerHTML);
    } catch (err) {
        return panicReturn();
    }
};

module.exports = repairSvg;
