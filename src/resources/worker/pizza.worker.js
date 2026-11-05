const fs = require('fs/promises');
const path = require('path');

const { Jimp, JimpMime } = require('jimp');

const pizzaToppings = require("../pizza-toppings.json");

const layerPizza = async ({ toppings, filePath }) => {
    // load textures
    const textureCrust = await Jimp.read(`./assets/pizza/crust.png`);
    const textureSauce = await Jimp.read(`./assets/pizza/sauce.png`);
    const textureCheese = await Jimp.read(`./assets/pizza/cheese.png`);
    const texturesToppings = {};
    for (const topping of toppings)
        texturesToppings[topping] = await Jimp.read(`./assets/pizza/toppings/${topping}.png`);

    // NOTE: When you specify "air" or "bread" as first topping, dont put sauce.
    // NOTE: When you specify "air" or "bread" or "sauce" as first topping, dont put the default cheese layer.
    const baseImage = textureCrust.clone();
    const consumedFirstArgument = pizzaToppings.toppingsConsumed.includes(toppings[0]) ? toppings.shift()
        : null;
    if (consumedFirstArgument !== 'air' && consumedFirstArgument !== 'bread')
        baseImage.composite(textureSauce, 0, 0);
    if (consumedFirstArgument !== 'air' && consumedFirstArgument !== 'bread' && consumedFirstArgument !== 'sauce')
        baseImage.composite(textureCheese, 0, 0);

    // add toppings
    const addedToppings = new Set();
    for (let i = 0; i < toppings.length; i++) {
        const topping = toppings[i];

        // If we already added this topping before then only add 2 more images ontop.
        const amountToPlace = addedToppings.has(topping) ? 2 : pizzaToppings.toppingCounts[topping] || 2;
        addedToppings.add(topping);
        for (let _ = 0; _ < amountToPlace; _++) {
            /** @type {import("jimp").JimpInstance} */
            const texture = texturesToppings[topping].clone();
            const mag = Math.floor(Math.random() * 192);
            const dir = Math.floor(Math.random() * 360);
            
            const x = (mag * Math.cos(dir)) - Math.round(texture.width / 2 - baseImage.width / 2);
            const y = (mag * Math.sin(dir)) - Math.round(texture.height / 2 - baseImage.height / 2);
            texture.rotate(Math.floor(Math.random() * 360));
            baseImage.composite(texture, x, y);
        }
    }

    // output
    const buffer = await baseImage.getBuffer(JimpMime.png);
    await fs.writeFile(filePath, buffer);
};
const runWorker = async (data) => {
    return await layerPizza(data);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        const result = await runWorker(data);
        process.send({ success: true, result: result });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;
