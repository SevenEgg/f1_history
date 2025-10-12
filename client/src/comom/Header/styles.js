import styled from "styled-components";

const Header = styled.div`
    position:fixed ;
    left:0 ;
    top: 0;
    right: 0;
    padding-left: 250px;
    color: rgb(214, 214, 214);
    /* background-color: #e10600; */
    background: #15151e;
    max-width: 100%;
    width: auto;
    z-index: 998;
`

const HeaderContent = styled.div`
    display: flex;
    justify-content:end;
    align-items: center;
    margin: 0px auto;
    padding:0 28px;
    height: 52px;
`
const HeaderTitle = styled.div`
    flex: 1 1 0%;
    color: rgb(255, 255, 255);
    font-size: 16px;
    font-weight: 400;
`

const HeaderRight = styled.div`
   float: right;
   display: flex;
   align-items: center;
   justify-content: center;

   .welcomeText {
        color: #fff;
        font-size: 13px;
        font-weight: 400;
        padding-right: 8px;
   }

   .loginOut {
        color: #fff;
        font-size: 13px;
        font-weight: 400;
        cursor: pointer;
   }
   .loginOut:hover {
        color: #ccc;
   }
   .line {
        color: #ccc;
        padding-right: 8px;
        font-size: 12px;
   }
`

export {
    Header,
    HeaderContent,
    HeaderTitle,
    HeaderRight
}