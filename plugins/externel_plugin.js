const {
        inrl,
        runtime,
        add_plugin,
        dlt_plugin,
        getListOfPlugin,
        extractUrlsFromString,
        getLang
} = require('../lib');
let lang = getLang()
const {
        exec
} = require("child_process");
const Config = require('../config')
const axios = require("axios");
const fs = require("fs");
inrl({
        pattern: 'restart ?(.*)',
        desc: lang.RESTART.DESC,
        react: "🥱",
        type: "system",
        fromMe: true
}, async (message, match) => {
        await message.reply(lang.RESTART.INFO)
        exec('pm2 restart all')
})
inrl({
        pattern: 'plugin ?(.*)',
        desc: lang.EXTERNAL_PLUGIN.DESC,
        react: "🦥",
        type: "system",
        fromMe: true
}, async (message, match) => {
        match = match || message.reply_message.text;
        let text = "",
                name, urls;
        if (match && extractUrlsFromString(match)) {
                await message.reply(lang.BASE.WAIT)
                const urll = extractUrlsFromString(match);
                if (!urll[0]) return message.send(lang.BASE.NEED_URL)
                urll.map(async (url) => {
                        let NewUrl = !url?.toString().includes('/raw') ? url.toString() + '/raw' : url.toString()
                        let plugin_name;
                        let {
                                data,
                                status
                        } = await axios(NewUrl).catch((e) => {
                                return message.reply(lang.BASE.INVALID_URL)
                        })
                        if (status == 200) {
                                try {
                                plugin_name = data.match(/(?<=pattern:) ["'](.*?)["']/);
                                plugin_name = plugin_name[0].replace(/["']/g, "").trim().split(" ")[0] + "test";
                                fs.writeFileSync(__dirname + "/" + plugin_name + ".js", data);
                                        require("./" + plugin_name);
                                } catch (e) {
                                        fs.unlinkSync(__dirname + "/" + plugin_name + ".js");
                                        return await message.reply(e);
                                }
                                await message.reply(lang.EXTERNAL_PLUGIN.INSTALLED.format(plugin_name.split('test')[0]))
                                await add_plugin(plugin_name.split('test')[0], NewUrl, message.client.user.number)
                                fs.unlinkSync(__dirname + "/" + plugin_name + ".js");
                        }
                });
        } else {
                let list = await getListOfPlugin(message.client.user.number);
                if (list == 'no data') return await message.reply(lang.EXTERNAL_PLUGIN.NO_PLUGIN)
                let text = lang.EXTERNAL_PLUGIN.LIST
                for (let i = 0; i < list.length; i++) {
                        name = list[i].name;
                        urls = list[i].url;
                        text += name + "\n" + urls + "\n";
                }
                if (text) {
                        return await message.reply(text)
                } else {
                        return await message.send(lang.BASE.FAILD)
                }
        }
})
inrl({
        pattern: 'remove ?(.*)',
        desc: lang.EXTERNAL_PLUGIN.REMOVE_DESC,
        react: "😶",
        type: "system",
        fromMe: true
}, async (message, match) => {
        if (!match) return await message.send("*Give me a plugin name thet you want to remove*");
        let list = await getListOfPlugin(message.client.user.number),
                name = "",
                avb = false;
        if (list == 'no data') return message.reply(lang.EXTERNAL_PLUGIN.NO_PLUGIN)
        for (let i = 0; i < list.length; i++) {
                name = list[i].name;
                if (name == match) {
                        await dlt_plugin(match, message.client.user.number)
                        return await message.send(lang.EXTERNAL_PLUGIN.REMOVED);
                        avb = true;
                } 
        }
        if (avb) return await message.reply(lang.EXTERNAL_PLUGIN.NO_PLUGIN);
})
