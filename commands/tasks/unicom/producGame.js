// 娱乐中心
const CryptoJS = require("crypto-js");
var crypto = require('crypto');
const { default: PQueue } = require('p-queue');
const moment = require('moment');
const path = require('path');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams } = require('./CryptoUtil')
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};


var deviceInfos = [
    'm=VKY-AL00&o=9&a=28&p=1080*1920&f=HUAWEI&mm=5725&cf=1800&cc=8&qqversion=null',
    'm=SM-G977N&o=7&a=24&p=1080*1920&f=samsung&mm=5725&cf=1800&cc=8&qqversion=null',
    'm=Pixel&o=8&a=27&p=1080*1920&f=google&mm=5725&cf=1800&cc=8&qqversion=null'
]
var deviceInfo = deviceInfos[Math.floor(Math.random() * deviceInfos.length)]

var producGame = {
    // 娱乐中心每日签到-打卡
    gameSignin: (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let data = {
            'methodType': 'signin'
        }
        return new Promise((resolve, reject) => {
            axios.request({
                baseURL: 'https://m.client.10010.com/',
                headers: {
                    "user-agent": useragent,
                    "referer": "https://img.client.10010.com",
                    "origin": "https://img.client.10010.com"
                },
                url: `/producGame_signin`,
                method: 'post',
                data: transParams(data)
            }).then(res => {
                let result = res.data
                if (result) {
                    if (result.respCode !== '0000') {
                        console.error('娱乐中心每日签到失败', result.respDesc)
                    } else {
                        if (result.currentIntegral) {
                            console.reward('integral', result.currentIntegral)
                            console.info('娱乐中心每日签到获得+' + result.currentIntegral)
                        } else {
                            console.info('娱乐中心每日签到', result.respDesc)
                        }
                    }
                } else {
                    console.error('娱乐中心每日签到失败')
                }
                resolve()
            }).catch(reject)
        })
    },

    playGame: async (axios, options) => {
        const { game, launchid, jar } = options

        let cookiesJson = jar.toJSON()
        let jwt = cookiesJson.cookies.find(i => i.key == 'jwt')
        if (!jwt) {
            throw new Error('jwt缺失')
        }
        jwt = jwt.value

        let playGame = require(path.resolve(path.join(__dirname, './playGame.json')));
        let protobufRoot = require('protobufjs').Root;
        let root = protobufRoot.fromJSON(playGame);
        let mc = root.lookupType('JudgeTimingBusiBuff');
        let launchId1 = launchid || new Date().getTime() + ''

        let n = 1;

        do {
            console.info('第', n, '次')
            let dd = moment().format('MMDDHHmmss')
            let time = new Date().getTime() % 1000
            let s = Math.floor(Math.random() * 90000) + 10000
            let traceid = `${options.user}_${dd}${time}_${s}`
            let Seq = n * 3

            let a = {
                'uin': `${options.user}`,
                'sig': jwt,
                'platform': '2001',
                'type': 0,
                'appid': '101794394'
            }
            let busiBuff = {
                extInfo: null,
                appid: game.gameCode,
                factType: n == 6 ? 13 : 12,
                duration: null,
                reportTime: Math.floor(new Date().getTime() / 1000) + n * 62,
                afterCertify: 0,
                appType: 1,
                scene: 1001,
                totalTime: n * 62,
                launchId: launchId1,
                via: '',
                AdsTotalTime: 0,
                hostExtInfo: null
            }
            let c = {
                'Seq': Seq,
                'qua': 'V1_AND_MINISDK_1.5.3_0_RELEASE_B',
                'deviceInfo': deviceInfo,
                'busiBuff': busiBuff,
                'traceid': traceid,
                'Module': `mini_app_growguard`,
                'Cmdname': 'JudgeTiming',
                'loginSig': a,
                'Crypto': null,
                'Extinfo': null,
                'contentType': 0
            }

            let infoEncodeMessage = mc.encode(mc.create(c)).finish();

            let Nonce = Math.floor(Math.random() * 90000) + 10000
            let Timestamp = Math.floor(new Date().getTime() / 1000)

            let str = `POST /mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}`
            let Signature = CryptoJS.HmacSHA256(str, 'test')
            let hashInBase64 = CryptoJS.enc.Base64.stringify(Signature);

            let res = await axios.request({
                headers: {
                    "user-agent": "okhttp/4.4.0"
                },
                jar: null,
                url: `https://q.qq.com/mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}&Signature=${hashInBase64}`,
                method: 'post',
                responseType: 'arrayBuffer',
                data: infoEncodeMessage
            }).catch(err => console.error(err))

            console.info(Buffer.from(res.data).toString('hex'))

            // 这里不等待1分钟，上面使用 n*62 时长累计来替代，也可正常领取
            await new Promise((resolve, reject) => setTimeout(resolve, 45 * 1000))

            ++n
        } while (n <= 6)
    },
    gameInfo: async (axios, options) => {
        const { game, jar } = options

        let cookiesJson = jar.toJSON()
        let jwt = cookiesJson.cookies.find(i => i.key == 'jwt')
        if (!jwt) {
            throw new Error('jwt缺失')
        }
        jwt = jwt.value

        let playGame = require(path.resolve(path.join(__dirname, './playGame.json')));
        let protobufRoot = require('protobufjs').Root;
        let root = protobufRoot.fromJSON(playGame);
        let mc = root.lookupType('GetAppInfoByLinkBusiBuff');

        let n = 1;

        let dd = moment().format('MMDDHHmmss')
        let time = new Date().getTime() % 1000
        let s = Math.floor(Math.random() * 90000) + 10000
        let traceid = `${options.user}_${dd}${time}_${s}`
        let Seq = n * 3

        let a = {
            'uin': `${options.user}`,
            'sig': jwt,
            'platform': '2001',
            'type': 0,
            'appid': '101794394'
        }
        let busiBuff = {
            link: game.url,
            linkType: 0
        }
        let c = {
            'Seq': Seq,
            'qua': 'V1_AND_MINISDK_1.5.3_0_RELEASE_B',
            'deviceInfo': deviceInfo,
            'busiBuff': Buffer.from(JSON.stringify(busiBuff)),
            'traceid': traceid,
            'Module': `mini_app_info`,
            'Cmdname': 'GetAppInfoByLink',
            'loginSig': a,
            'Crypto': null,
            'Extinfo': null,
            'contentType': 1
        }

        let infoEncodeMessage = mc.encode(mc.create(c)).finish();

        let Nonce = Math.floor(Math.random() * 90000) + 10000
        let Timestamp = Math.floor(new Date().getTime() / 1000)

        let str = `POST /mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}`
        let Signature = CryptoJS.HmacSHA256(str, 'test')
        let hashInBase64 = CryptoJS.enc.Base64.stringify(Signature);

        let res = await axios.request({
            headers: {
                "user-agent": "okhttp/4.4.0"
            },
            jar: null,
            url: `https://q.qq.com/mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}&Signature=${hashInBase64}`,
            method: 'post',
            responseType: 'arrayBuffer',
            data: infoEncodeMessage
        }).catch(err => console.error(err))
        let result = JSON.parse(Buffer.from(res.data).slice(0x7).toString('utf-8'))
        return result
    },
    popularGames: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'popularGames',
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
        }
        let { data, config } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            return {
                jar: config.jar,
                popularList: data.popularList || []
            }
        } else {
            console.error('记录失败')
        }
    },
    gameverify: async (axios, options) => {
        const { jar } = options
        let cookiesJson = jar.toJSON()
        let jwt = cookiesJson.cookies.find(i => i.key == 'jwt')
        if (!jwt) {
            throw new Error('jwt缺失')
        }
        jwt = jwt.value

        let { data } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": "okhttp/4.4.0",
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/game/verify`,
            method: 'post',
            data: {
                "extInfo": jwt,
                "auth": {
                    "uin": options.user,
                    "sig": jwt
                }
            }
        })
        if (data) {
            if (data.respCode !== 0) {
                console.info(data.errorMessage)
            }
        } else {
            console.error('记录失败')
        }
    },
    gamerecord: async (axios, options) => {
        const { gameId } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'record',
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
            'gameId': gameId,
            'taskId': ''
        }
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
        } else {
            console.error('记录失败')
        }
    },
    queryIntegral: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'queryIntegral',
            'taskCenterId': options.taskCenterId,
            'videoIntegral': '0',
            'isVideo': 'Y',
            'clientVersion': appInfo.version,
            'deviceType': 'Android'
        }
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameTaskCenter`,
            method: 'post',
            data: transParams(params)
        })
        if (data.code === '0000') {
            console.info('获取积分任务状态成功')
        } else {
            console.error('获取积分任务状态失败')
        }
    },
    getTaskList: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'queryTaskCenter',
            'deviceType': 'Android',
            'clientVersion': appInfo.version
        }
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameTaskCenter`,
            method: 'post',
            data: transParams(params)
        })
        if (data.code === '0000') {
            // reachState 0未完成, 1未领取, 2已完成
            return {
                jar: config.jar,
                games: data.data
            }
        } else {
            console.error('获取游戏任务失败')
            return {}
        }
    },
    doGameFlowTask: async (axios, options) => {
        let { popularList: allgames, jar } = await producGame.popularGames(axios, options)
        games = allgames.filter(g => g.state === '0')
        console.info('剩余未完成game', games.length)
        let queue = new PQueue({ concurrency: 5 });

        // 特例游戏
        // 亿万豪车2
        let others = ['1110422106']

        console.info('--->>代刷圈钱狗必死🐴  调度任务中', '并发数', 5)
        for (let game of games) {
            queue.add(async () => {
                console.info(game.name)
                if (others.indexOf(game.gameCode) !== -1) {
                    await require('./xiaowogameh5').playGame(axios, {
                        ...options,
                        game
                    })
                } else {
                    await producGame.gameverify(axios, {
                        ...options,
                        jar,
                        game
                    })
                    await producGame.playGame(axios, {
                        ...options,
                        jar,
                        game
                    })
                }
            })
        }

        await queue.onIdle()

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 30) * 1000))
        
        let { popularList: undonegames, undonejar } = await producGame.timeTaskQuery(axios, options)
        games = undonegames.filter(g => g.state === '1')
        console.info('---> 且用且珍惜🍀 剩余未领取game', games.length)
        for (let game of games) {
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 15) * 1000))
            await producGame.gameFlowGet(axios, {
                ...options,
                gameId: game.id
            })
        }
    },
    doGameIntegralTask: async (axios, options) => {
        let { games, jar } = await producGame.getTaskList(axios, options)
        games = games.filter(d => d.task === '5' && d.reachState === '0' && d.task_type === 'duration')
        console.info('剩余未完成game', games.length)
        let queue = new PQueue({ concurrency: 5 });

        console.info('调度任务中', '并发数', 5)
        for (let game of games) {
            queue.add(async () => {
                console.info(game.name)
                await producGame.gameverify(axios, {
                    ...options,
                    jar,
                    game
                })
                await producGame.gamerecord(axios, {
                    ...options,
                    gameId: game.game_id
                })
                await producGame.playGame(axios, {
                    ...options,
                    jar,
                    game: {
                        ...game,
                        gameCode: game.resource_id
                    }
                })
            })
        }

        await queue.onIdle()

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 30) * 1000))
        let { games: cgames } = await producGame.getTaskList(axios, options)
        games = cgames.filter(d => d.task === '5' && d.reachState === '1' && d.task_type === 'duration')
        console.info('剩余未领取game', games.length)
        for (let game of games) {
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 20) * 1000))
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: game.id
            })
        }

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 5) + 5) * 1000))
        let { games: ngames } = await producGame.getTaskList(axios, options)
        let task_times = ngames.find(d => d.task === '3' && d.task_type === 'times')
        if (task_times && task_times.reachState === '1') {
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 15) * 1000))
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: task_times.id
            })
        }
    },
    timeTaskQuery: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'popularGames',
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
        }
        let { data, config } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            return {
                jar: config.jar,
                popularList: data.popularList || []
            }
        } else {
            console.error('记录失败')
        }
    },
    gameFlowGet: async (axios, options) => {
        const { gameId } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'userNumber': options.user,
            'methodType': 'flowGet',
            'gameId': gameId,
            'deviceType': 'Android',
            'clientVersion': appInfo.version
        }
        let { data } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com",
                "X-Requested-With": appInfo.package_name
            },
            url: `/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
            if (data.msg.indexOf('防刷策略接口校验不通过') !== -1) {
               // throw new Error('出现【防刷策略接口校验不通过】, 取消本次执行')
               console.error('获取奖励失败')
            }
            console.reward('flow', '100m')
        } else {
            console.error('获取奖励失败')
        }
    },
    gameIntegralGet: async (axios, options) => {
        const { taskCenterId } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'taskGetReward',
            'taskCenterId': taskCenterId,
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
        }
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameTaskCenter`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
            if (data.msg.indexOf('防刷策略接口校验不通过') !== -1) {
            //    throw new Error('出现【防刷策略接口校验不通过】, 取消本次执行')
            console.error('获取奖励失败')
            }
            console.reward('integral', 5)
        } else {
            console.error('获取奖励失败')
        }
    },
    gameBox: async (axios, options) => {
        let { games: v_games } = await producGame.getTaskList(axios, options)
        let box_task = v_games.find(d => d.task_type === 'box' && d.reachState !== '2')
        if (box_task) {
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: box_task.id
            })
        }
    },
    watch3TimesVideoQuery: async (request, options) => {
        let params = {
            'arguments1': 'AC20200728150217', // acid
            'arguments2': 'GGPD', // yhChannel
            'arguments3': '96945964804e42299634340cd2650451', // yhTaskId menuId
            'arguments4': new Date().getTime(), // time
            'arguments6': '',
            'netWay': 'Wifi',
            'version': appInfo.unicom_version,
            'codeId': 945535736
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        return await require('./taskcallback').query(request, {
            ...options,
            params
        })
    },
    watch3TimesVideo: async (axios, options) => {
        const { jar } = options
        let params = {
            'arguments1': 'AC20200728150217',
            'arguments2': 'GGPD',
            'arguments3': '96945964804e42299634340cd2650451',
            'arguments4': new Date().getTime(),
            'arguments6': '',
            'arguments7': '',
            'arguments8': '',
            'arguments9': '',
            'netWay': 'Wifi',
            'remark1': '游戏频道看视频得积分',
            'remark': '游戏视频任务积分',
            'version': appInfo.unicom_version,
            'codeId': 945535736
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        await require('./taskcallback').doTask(axios, {
            ...options,
            params,
            jar
        })
    },
    doTodayDailyTask: async (axios, options) => {

        let { games: v_games } = await producGame.getTaskList(axios, options)
        let video_task = v_games.find(d => d.task_type === 'video')

        if (video_task.reachState === '0') {
            let n = parseInt(video_task.task) - parseInt(video_task.progress)
            console.info('领取视频任务奖励,剩余', n, '次')
            let { jar } = await producGame.watch3TimesVideoQuery(axios, options)
            let i = 1
            while (i <= n) {
                await producGame.watch3TimesVideo(axios, {
                    ...options,
                    jar
                })
                await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 5) + 2) * 200))
                await producGame.getTaskList(axios, options)
                await producGame.queryIntegral(axios, {
                    ...options,
                    taskCenterId: video_task.id
                })
                ++i
            }
        }

        let { games } = await producGame.getTaskList(axios, options)
        let today_task = games.find(d => d.task_type === 'todayTask')
        if (!today_task) {
            console.info('未取得今日任务，跳过')
            return
        }
        if (today_task.reachState === '0') {
            throw new Error('部分日常任务未完成，下次再尝试领取完成今日任务流量')
        } else if (today_task.reachState === '1') {
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: today_task.id
            })
            console.reward('flow', '200m')
            console.info('领取完成今日任务流量+200m')
        } else if (today_task.reachState === '2') {
            console.info('每日日常任务已完成')
        }
    }
}


module.exports = producGame