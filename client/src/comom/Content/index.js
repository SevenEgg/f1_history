import { 
    MainContent, 
    ContentWrap,
    Content 
} from "./styles";

function PageContent({ children }) {
    return (
        <ContentWrap>
            <MainContent>
                <Content>{children}</Content>
            </MainContent>
        </ContentWrap>

    )
}

export default PageContent;