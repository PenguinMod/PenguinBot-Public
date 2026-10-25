/**
* @fileoverview Utilities to recreate `canvas` behavior in `skia-canvas`, and add some extra stuff
*/
class SkiaCanvasUtil {
    // TODO: Consider adding strokeText equivalents?
    /**
     * Reimplements maxWidth text squishing for skia-canvas
     * @param {import("skia-canvas").CanvasRenderingContext2D} ctx 
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {number?} maxWidth 
     * @returns {void}
     */
    static fillText(ctx, text, x, y, maxWidth = Infinity) {
        const measurements = ctx.measureText(text);
        const width = measurements.width;
        if (width <= maxWidth) {
            ctx.fillText(text, x, y);
            return;
        }
        
        // DISCLOSURE: ai written because this is likely canon way to implement this
        const scale = maxWidth / width;
        ctx.save();
        if (ctx.textAlign === "center") {
            ctx.translate(x, y);
            ctx.scale(scale, 1);
            ctx.fillText(text, 0, 0);
        } else if (ctx.textAlign === "right" || ctx.textAlign === "end") {
            ctx.translate(x, y);
            ctx.scale(scale, 1);
            ctx.fillText(text, 0, 0);
        } else {
            ctx.translate(x, y);
            ctx.scale(scale, 1);
            ctx.fillText(text, 0, 0);
        }
        ctx.restore();
    }
    /**
     * Adds word wrapping & new line characters when drawing
     * @param {import("skia-canvas").CanvasRenderingContext2D} ctx 
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {number?} maxWidth 
     * @returns {void}
     */
    static fillTextWrapped(ctx, text, x, y, maxWidth = Infinity, lineHeight = 20) {
        // DISCLOSURE: ai written because this is Really annoying to implement; i did try to add extra notes to some confusing parts thou
        const lines = [];
        for (const paragraph of String(text).split(/\r?\n/)) {
            // this looks a little odd but it has to be able to break apart down to the letters of each word (when necessary) to do wrapping
            let line = "";
            const words = paragraph.split(/\s+/);
            for (const word of words) {
                // adding a word to the line, is it still fitting?
                const candidate = line ? `${line} ${word}` : word;
                if (ctx.measureText(candidate).width <= maxWidth) {
                    // line works fine as is
                    line = candidate;
                    continue;
                }
                
                // Current line is full; commit it first.
                if (line) {
                    // Move the last word to the next line when the preceding words still fit on their own, avoiding an unnecessarily short final line
                    const parts = line.split(/\s+/);
                    if (parts.length > 1 && ctx.measureText(parts.slice(0, -1).join(" ")).width <= maxWidth) {
                        const last = parts.pop();
                        lines.push(parts.join(" "));
                        line = `${last} ${word}`;

                        // move to next word if the new line now fits
                        if (ctx.measureText(line).width <= maxWidth)
                            continue;
                    }

                    lines.push(line);
                    line = "";
                }
                
                // If the word itself is too wide, split it across lines.
                let remaining = word;
                while (remaining) {
                    // this cuts the word until its able to fit or we are left with 1 char
                    let cut = remaining.length;
                    while (cut > 1 && ctx.measureText(remaining.slice(0, cut)).width > maxWidth) {
                        cut--;
                    }
                    
                    // At least one character goes on the line.
                    lines.push(remaining.slice(0, cut));
                    remaining = remaining.slice(cut);
                }
            }
            
            // Preserve the paragraph, including an empty line. this also adds the line if nothgin else did before
            lines.push(line);
        }
        
        // Avoid drawing an extra line for the final empty string unless the input actually ended with a newline.
        if (lines.length && lines[lines.length - 1] === "" && !String(text).endsWith("\n"))
            lines.pop();
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * lineHeight);
        }
    }
}

module.exports = SkiaCanvasUtil;
