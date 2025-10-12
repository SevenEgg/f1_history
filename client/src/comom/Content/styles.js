import styled from "styled-components";

const ContentWrap = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 100%;
    flex: 1 0 auto;
    width: 100%;
    min-width: 320px;
    margin: 0px auto;
    height: 100%;
    padding-left: 250px;
   
`

const MainContent = styled.div`
    padding-top:52px;
    height: 100%;
    background-color: rgb(240, 243, 248);
`
const Content = styled.div`
    padding: 28px 50px;
    // max-width: 1200px;
    margin: 0px auto;
    min-height: calc(100vh - 56px);
`
export {
    ContentWrap,
    MainContent,
    Content
}
