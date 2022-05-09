// ==UserScript==
// @name         CarSell(Test)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  沪牌拍卖自动出价程序
// @author       Eathen
// @match        https://testh5.alltobid.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function fillInput(input, value, tag) {
        if (!!input) {
            input.value = value;
            let event = new Event('input', { bubbles: true });
            let tracker = input._valueTracker;
            if (tracker) {
                tracker.setValue('');
            }
            input.dispatchEvent(event);
            console.info(TAG, "fill " + tag + " input with: " + value);
        }
    }

    // 日志前缀TAG
    let TAG = "[CarSell]";
    console.info(TAG, "Engine Start");

    // 首次出价阶段
    let timeToEnterVarifyCode1 = 60;
    var hasFirstChargeTime = false;
    var firstChargeTimeText;
    var firstChargeMoney;
    var hasFirstCharge = false;
    // 修改出价阶段
    let timeToEnterVarifyCode2 = 12;
    let backupUpdateSecondChargeMoneyTime = 6;
    let raiseSecondMoneyStep = 600;
    var hasSecondChargeTime = false;
    var secondChargeTimeText;
    var secondChargeMoney;
    var hasSecondCharge = false;
    var hasConfirmCharge = false;
    // 当前阶段
    var currentStage = "";
    var currentSystemTime = "";
    // 启动循环检测
    let mainInfoChecker = setInterval(() => {
        // 获取首次出价时间段
        if (!hasFirstChargeTime) {
            let firstChargeTime = document.evaluate("//span[contains(., '首次出价时段:')]", document, null, XPathResult.ANY_TYPE, null).iterateNext()
            if (!!firstChargeTime) {
                // 获取起止时间点
                hasFirstChargeTime = true;
                let firstStartTime = firstChargeTime.children[0].innerText;
                let firstStopTime = firstChargeTime.children[1].innerText;
                console.info(TAG, "firstChargeTimeRange: " + firstStartTime + " to " + firstStopTime)
                // 计算截止出价时间点
                firstChargeTime = new Date();
                firstChargeTime.setHours(parseInt(firstStopTime.split(":")[0]));
                firstChargeTime.setMinutes(parseInt(firstStopTime.split(":")[1]));
                firstChargeTime.setSeconds(0);
                // 预留验证码输入时间
                firstChargeTime.setTime(firstChargeTime.getTime() - (1000 * timeToEnterVarifyCode1));
                // 转换成问题
                firstChargeTimeText = firstChargeTime.getHours() + ":";
                if (firstChargeTime.getMinutes() < 10) {
                    firstChargeTimeText += "0";
                }
                firstChargeTimeText += firstChargeTime.getMinutes() + ":";
                if (firstChargeTime.getSeconds() < 10) {
                    firstChargeTimeText += "0";
                }
                firstChargeTimeText += firstChargeTime.getSeconds();
                console.info(TAG, "firstChargeTime: " + firstChargeTimeText);
            }
        }

        // 获取修改出价时间段
        if (!hasSecondChargeTime) {
            let secondChargeTime = document.evaluate("//span[contains(., '修改出价时段:')]", document, null, XPathResult.ANY_TYPE, null).iterateNext()
            if (!!secondChargeTime) {
                // 获取起止时间点
                hasSecondChargeTime = true;
                let secondStartTime = secondChargeTime.children[0].innerText;
                let secondStopTime = secondChargeTime.children[1].innerText;
                console.info(TAG, "secondChargeTimeRange: " + secondStartTime + " to " + secondStopTime)
                // 计算截止出价时间点
                secondChargeTime = new Date();
                secondChargeTime.setHours(parseInt(secondStopTime.split(":")[0]));
                secondChargeTime.setMinutes(parseInt(secondStopTime.split(":")[1]));
                secondChargeTime.setSeconds(0);
                // 预留验证码输入时间
                secondChargeTime.setTime(secondChargeTime.getTime() - (1000 * timeToEnterVarifyCode2));
                // 转换成问题
                secondChargeTimeText = secondChargeTime.getHours() + ":";
                if (secondChargeTime.getMinutes() < 10) {
                    secondChargeTimeText += "0";
                }
                secondChargeTimeText += secondChargeTime.getMinutes() + ":";
                if (secondChargeTime.getSeconds() < 10) {
                    secondChargeTimeText += "0";
                }
                secondChargeTimeText += secondChargeTime.getSeconds();
                console.info(TAG, "secondChargeTime: " + secondChargeTimeText);
            }
        }

        // 获取当前所处阶段
        let stageText = document.querySelector(".stageTxt");
        if (!!stageText) {
            let text = stageText.children[0].innerText;
            if (currentStage != text) {
                console.info(TAG, "current stage change to: " + text);
                currentStage = text;
            }
        }

        // 获取当前系统时间
        let systemTime = document.evaluate("//span[contains(., '系统目前时间:')]", document, null, XPathResult.ANY_TYPE, null).iterateNext()
        if (!!systemTime && !!systemTime.children[0]) {
            currentSystemTime = systemTime.children[0].innerText;
        }

        // 根据不同阶段进行出价
        if (currentStage == "首次出价时段" && currentSystemTime >= firstChargeTimeText) {
            let currentMoney = document.evaluate("//span[contains(., '目前最低可成交价:')]", document, null, XPathResult.ANY_TYPE, null).iterateNext()
            if (!!currentMoney && !!currentMoney.children[0] && !hasFirstCharge) {
                hasFirstCharge = true;
                // 获取最低成交价
                firstChargeMoney = currentMoney.children[0].innerText;
                console.info(TAG, "begin first charge with money: " + firstChargeMoney);
                // 修改输入框出价
                let moneyInput1 = document.querySelector(".whfinput01");
                fillInput(moneyInput1, firstChargeMoney, "prefer charge");
                // 修改确认框出价
                let moneyInput2 = document.querySelector(".whfinput02");
                fillInput(moneyInput2, firstChargeMoney, "confirm charge");
                // 点击确认
                let confirmButton = document.querySelector(".whfbtn");
                if (!!confirmButton) {
                    confirmButton.click();
                    console.info(TAG, "click submit button");
                    let verifyCodeChecker = setInterval(() => {
                        let verifyCodeInput = document.querySelector("#bidprice");
                        if (!!verifyCodeInput) {
                            verifyCodeInput.focus();
                            let event = new Event('input', { bubbles: true });
                            verifyCodeInput.dispatchEvent(event);
                            clearInterval(verifyCodeChecker);
                            console.info(TAG, "focus to verify code input");
                        }
                    }, 100);
                }
            }
        } else if (currentStage == "修改出价时段" && currentSystemTime >= secondChargeTimeText) {
            // 获取出价框和出价按钮
            let moneyInput = document.querySelector(".whsetpriceinput");
            let confirmButton = document.querySelector(".whsetpricebtn");
            let currentMoney = document.evaluate("//span[contains(., '目前最低可成交价:')]", document, null, XPathResult.ANY_TYPE, null).iterateNext()
            // 计算出价值
            if (!hasSecondCharge) {
                if (!!currentMoney && !!currentMoney.children[0]) {
                    hasSecondCharge = true;
                    // 获取最低成交价
                    secondChargeMoney = parseInt(currentMoney.children[0].innerText) + raiseSecondMoneyStep;
                    console.info(TAG, "begin second charge with money: " + secondChargeMoney + "(" + currentMoney.children[0].innerText + "+" + raiseSecondMoneyStep + ")");
                    // 修改输入框出价
                    fillInput(moneyInput, secondChargeMoney, "confirm charge");
                }
            }

            if (!hasConfirmCharge) {
                if (!!currentMoney && !!currentMoney.children[0]) {
                    // 获取最低成交价
                    secondChargeMoney = parseInt(currentMoney.children[0].innerText);
                }
                // 判断是否需要兜底出价
                if (currentSystemTime.split(":")[2] >= ((60 - backupUpdateSecondChargeMoneyTime).toString())) {
                    if (!!currentMoney && !!currentMoney.children[0]) {
                        // 获取最低成交价
                        let updateSecondChargeMoney = parseInt(currentMoney.children[0].innerText) + 300;
                        console.info(TAG, "update second charge with money: " + updateSecondChargeMoney + "(" + currentMoney.children[0].innerText + "+300)");
                        // 修改输入框出价
                        fillInput(moneyInput, updateSecondChargeMoney, "confirm charge");
                    }
                }
                // 判断是否落在区间可以出价
                let currentConfirmCharge = parseInt(moneyInput.value);
                if (currentConfirmCharge >= (secondChargeMoney - 300) && currentConfirmCharge <= (secondChargeMoney + 300)) {
                    hasConfirmCharge = true;
                    confirmButton.click();
                    console.info(TAG, "preform click confirm button");
                    let verifyCodeChecker = setInterval(() => {
                        let verifyCodeInput = document.querySelector("#bidprice");
                        if (!!verifyCodeInput) {
                            verifyCodeInput.focus();
                            let event = new Event('input', { bubbles: true });
                            verifyCodeInput.dispatchEvent(event);
                            clearInterval(verifyCodeChecker);
                            console.info(TAG, "focus to verify code input");
                        }
                    }, 100);
                }
            }
        }
    }, 100);
})();