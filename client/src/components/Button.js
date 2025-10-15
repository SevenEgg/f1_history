import styled from "styled-components";
import { Button } from "antd";

// 基础按钮
const PrimaryBtn = styled(Button)`
    border-radius: 32px;
    color: rgb(255, 255, 255);
    background-color: rgb(52, 58, 64);
    border-color: rgb(52, 58, 64);
    font-size: 14px;
    font-weight: 600;
    line-height: 21px;
    padding: 4px 16px!important;
    &:hover{
        color: rgb(255, 255, 255)!important;
        background-color: rgb(35, 39, 43);
        border-color: rgb(29, 33, 36)!important;
    }
`


export {
    PrimaryBtn
}
