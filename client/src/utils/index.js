import superagent from 'superagent';
import { message as MSG } from 'antd';

// console 打印日志
export const logger = (...args) => {
    let arg = args;
    const message = ["%c[ZG_Tools]", "color:blue"];

    if (Array.isArray(args)) {
        try {
            message[0] = `${message[0]} %c${args[0]}`;
            message.push('color:red;');
            arg = args.slice(1);
        } catch (error) {
            console.log(error);
        }

        console.log(...message, ...arg);
    }
}

export const request = async ({ url, method, req = {}, files = [] }) => {
    logger("request URL:", url);
    logger("request QS:", JSON.stringify(req));

    // Retrieve token from localStorage
    const token = getLocalStorage('token') || '';

    try {
        let res;
        switch (method) {
            case "FORM":
                const fn = superagent.post(url)
                    .field(req)
                    .set('Authorization', `Bearer ${token}`)
                    .accept("json");
                if (files && files[0]) {
                    files.forEach(({ name: filename, file: filepath }) => {
                        fn.attach(filename, filepath);
                    });
                }
                res = await fn;
                break;
            case "JSON":
                res = await superagent.post(url)
                    .send(req)
                    .set('Authorization', `Bearer ${token}`)
                    .accept("json");
                break;
            default:
                res = await superagent.get(url)
                    .query(req)
                    .set('Authorization', `Bearer ${token}`)
                    .accept('json');
                break;
        }
        const {
            code,
            message
        } = res.body;

        if (code !== 200) {
            return MSG.warning(message);
        }

        return {
            data: res.body,
            success: true
        }

    } catch (error) {
        throw new Error(error.message);
    }


}

/**
 * 设置本地存储项，并带有过期时间
 * @param {string} key - 存储的键
 * @param {*} value - 需要存储的值
 * @param {number} [expirationDays=2] - 过期天数，默认为 2 天
 */
export const setLocalStorage = (key, value, expirationDays = 2) => {
    const now = new Date();
    // 设置过期时间戳，单位：毫秒
    const expiry = now.getTime() + expirationDays * 24 * 60 * 60 * 1000;
    const item = {
        value: value,
        expiry: expiry,
    };
    try {
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
    }
};

/**
 * 获取本地存储项，并检查是否过期
 * @param {string} key - 存储的键
 * @returns {*} - 如果存储项存在且未过期，返回存储的值；否则返回 null
 */
export const getLocalStorage = (key) => {
    try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        const now = new Date();
        // 检查是否过期
        if (now.getTime() > item.expiry) {
            // 如果过期，移除该项并返回 null
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    } catch (error) {
        console.error(`Error getting localStorage key "${key}":`, error);
        // 解析出错或localStorage不可用时也视为无效
        return null;
    }
};

/**
 * 移除本地存储项
 * @param {string} key - 要移除的键
 */
export const removeLocalStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
    }
};

/**
 * 清除对象中值为空的属性
 * @param {Object} obj - 需要清理的对象
 * @param {boolean} [removeEmptyString=true] - 是否移除空字符串
 * @param {boolean} [removeNull=true] - 是否移除 null
 * @param {boolean} [removeUndefined=true] - 是否移除 undefined
 * @returns {Object} - 返回清理后的新对象
 */
export const removeEmptyValues = (obj, removeEmptyString = true, removeNull = true, removeUndefined = true) => {
    // 如果不是对象或者是null，直接返回原值
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    // 创建对象的副本，避免修改原对象
    const result = Array.isArray(obj) ? [...obj] : { ...obj };

    // 遍历对象的所有键
    Object.keys(result).forEach(key => {
        const value = result[key];

        // 检查是否需要移除该值
        if (
            (removeEmptyString && value === '') ||
            (removeNull && value === null) ||
            (removeUndefined && value === undefined) ||
            (removeEmptyString && typeof value === 'string' && value.trim() === '')
        ) {
            if (Array.isArray(result)) {
                result.splice(Number(key), 1);
            } else {
                delete result[key];
            }
        } else if (typeof value === 'object') {
            // 递归处理嵌套对象
            result[key] = removeEmptyValues(value, removeEmptyString, removeNull, removeUndefined);
            // 如果处理后的对象为空，也删除该键
            if (Object.keys(result[key]).length === 0) {
                delete result[key];
            }
        }
    });

    return result;
};

// 使用示例：
/*
const data = {
    name: 'John',
    age: '',
    email: null,
    address: undefined,
    phone: '  ',
    details: {
        city: '',
        country: null,
        zip: undefined
    },
    hobbies: []
};

const cleanData = removeEmptyValues(data);
console.log(cleanData); // { name: 'John' }
*/

// import { setLocalStorage, getLocalStorage, removeLocalStorage } from '@/utils'; // 假设你的路径别名配置正确

// // 使用示例
// setLocalStorage('userInfo', { name: '张三', id: 123 }); // 存储用户信息，默认2天过期
// setLocalStorage('theme', 'dark', 7); // 存储主题设置，7天过期

// const userInfo = getLocalStorage('userInfo');
// if (userInfo) {
//   console.log('获取到用户信息:', userInfo);
// } else {
//   console.log('用户信息不存在或已过期');
// }

// removeLocalStorage('theme'); // 移除主题设置