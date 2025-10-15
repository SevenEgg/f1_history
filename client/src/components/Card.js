import styled from "styled-components";


const ContentCard = styled.div`
    border-radius: 4px;
    box-shadow: rgba(235, 235, 235, 0.4) 0px 2px 6px;
    background-color: rgb(255, 255, 255);
`

const BlockHeader = styled.div`
    background-color: rgb(250, 250, 250);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    transition: opacity 0.25s ease-out 0s;
`

const BlockOptions = styled.div`
    flex: 0 0 auto;
    padding-left: 20px;
`


const BlockTitle = styled.h3`
    min-height: 28px;
    font-size: 18px;
    font-weight: 500;
    line-height: 1.75;
    flex: 1 1 auto;
    margin: 0px;
    color: rgba(0, 0, 0, 0.85);
`

const BlockContent = styled.div`
    transition: opacity .25s ease-out;
    width: 100%;
    margin: 0 auto;
    padding:0;
    overflow-x: visible;
    border-bottom-right-radius: 3px;
    border-bottom-left-radius: 3px;
`

const ContentPadding = styled.div`
    padding: 24px;
`

export const PaginationWrap = styled.div`
    display: flex;
    justify-content: flex-end;
    padding:15px 10px;
`

export {
    ContentCard,
    BlockHeader,
    BlockOptions,
    BlockTitle,
    BlockContent,
    ContentPadding
}

