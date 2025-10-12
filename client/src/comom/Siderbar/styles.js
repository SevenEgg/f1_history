import styled from "styled-components";
import { Link } from 'react-router-dom';

const PageSiderbar = styled.div`
    position: fixed;
    top: 0px;
    bottom: 0px;
    left: 0px;
    z-index: 999;
    width: 250px;
    height: 100%;
    overflow-y: visible;
    background-color: rgb(255, 255, 255);
`

const SiderHeader = styled.div`
    background-color: rgb(52, 58, 64);
`
const HeaderContent = styled.div`
    display:flex ;
    align-items:center;
    justify-content: center;
    color: #000;
    height: 52px;
    padding: 0 18px;
    /* background-color:#e10600; */
    background: #15151e;
    font-size: 19px;
    font-weight: 500;
`
const LinkStyle = {
    color: "#FFF"
}

const SiderContent = styled.div`
    padding:18px;
    height:calc(100% - 70px);
    box-sizing: border-box;
    width: 100%;
`
const NavMain = styled.ul`
    padding-left: 0;
    list-style: none;
`

const NavItem = styled.li`
    display: flex;
    flex-direction: column;
`

const NavLink = styled(Link)`
    position: relative;
    display: flex;
    align-items: center;
    min-height: 36px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: 0.175px;
    color: rgb(85, 93, 101);
    padding: 8px 10px;
    margin: 2px 0px;
    border-radius: 3px;
    
    &:hover {
        color: rgb(0, 0, 0);
        background-color: rgb(233, 236, 239);
    }

    &.active{
        color: rgb(0, 0, 0);
        background-color: rgb(233, 236, 239);
    }
`

const NavLinkName = styled.span`
    display: inline-block;
    max-width: 100%;
    flex: 1 1 auto;
`

const NavItemIconStyle = {
    marginRight: "10px",
    fontSize: "16px",
    color: "rgb(109, 122, 134)"
}

const NavHeading = styled.li`
    list-style: none;
    padding-top: 28px;
    padding-bottom: 4px;
    padding-left: 10px;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing:1.2px;
    color: rgb(134, 144, 153);
`


export {
    PageSiderbar,
    SiderHeader,
    HeaderContent,
    LinkStyle,
    SiderContent,
    NavMain,
    NavItem,
    NavLink,
    NavLinkName,
    NavItemIconStyle,
    NavHeading
}