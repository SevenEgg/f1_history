import styled from "styled-components";

const LoginWrap = styled.div`
    display: flex;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background: #f0f3f8;
`

const LoginFrame = styled.div`
    background-position: 0 50%;
    background-size: cover;
    max-width: 450px;
    width: 100%;
    margin: auto;
    box-shadow:rgba(0, 0, 0, 0.05) 0px 8px 32px 0px;
    border-radius: 4px;
`

const TopFrame = styled.div`
    background-color: #fff;
    padding: 24px 20px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
`

const TopLogoWrap = styled.div`
    text-align: center;
`

const TopLogoText = styled.div`
    color: #343a40;
    font-size:36px;
    padding-bottom: 10px;
`

const TipsText = styled.p`
    color: #6c757d;
    text-align: center;
    font-size:14px;
    font-weight: 400;
`

const BotWrap = styled.div`

`

const BotFrame = styled.div`
    height: 24px;
    padding: 16px 24px;
`

export {
    LoginWrap,
    LoginFrame,
    TopFrame,
    TopLogoWrap,
    TopLogoText,
    TipsText,
    BotWrap,
    BotFrame
}