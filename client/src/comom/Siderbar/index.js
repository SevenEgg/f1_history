import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    CrownOutlined,
    BlockOutlined,
    FormOutlined,
    DiffOutlined,
    OrderedListOutlined,
    FontColorsOutlined,
    UserOutlined,
    ClusterOutlined
} from '@ant-design/icons';
import {
    PageSiderbar,
    SiderHeader,
    HeaderContent,
    LinkStyle,
    SiderContent,
    NavMain,
    NavItem,
    NavLinkName,
    NavItemIconStyle,
    NavLink,
    NavHeading
} from './styles';

const NavgtionLinks = [
    {
        path: "/",
        name: "数据大盘",
        type: "item",
        icon: <DashboardOutlined style={NavItemIconStyle} />
    },
    {
        name: "发单中心",
        type: "header"
    },
    {
        path: "/postList",
        name: "征稿管理",
        type: "item",
        icon: <FormOutlined style={NavItemIconStyle} />
    },
    {
        path: "/approvedTasks",
        name: "录用稿件",
        type: "item",
        icon: <DiffOutlined style={NavItemIconStyle} />
    },
    {
        path: "/selectedTasks",
        name: "精选稿件",
        type: "item",
        icon: <OrderedListOutlined style={NavItemIconStyle} />
    },
    {
        path: "/sentence",
        name: "金句管理",
        type: "item",
        icon: <FontColorsOutlined style={NavItemIconStyle} />
    },

    {
        name: "学员管理",
        type: "header"
    },
    {
        path: "/userList",
        name: "学员列表",
        type: "item",
        icon: <UserOutlined style={NavItemIconStyle} />
    },
    {
        path: "/rankList",
        name: "排行榜",
        type: "item",
        icon: <CrownOutlined style={NavItemIconStyle} />
    },
    {
        name: "系统管理",
        type: "header"
    },
    {
        path: "/transactionRecord",
        name: "流水记录",
        type: "item",
        icon: <BlockOutlined style={NavItemIconStyle} />
    },

    {
        path: "/messageCentre",
        name: "消息中心",
        type: "item",
        icon: <BlockOutlined style={NavItemIconStyle} />
    },
    {
        path: "/alarmCentre",
        name: "预警中心",
        type: "item",
        icon: <BlockOutlined style={NavItemIconStyle} />
    },
    {
        path: "/privilegeManagement",
        name: "系统用户",
        type: "item",
        icon: <ClusterOutlined style={NavItemIconStyle} />
    },

]

// 导航按钮
function RenderNavItem({ links, location }) {

    let onActive = "";
    links.forEach(item => {
        if (item?.path && location.pathname.includes(item['path'])) {
            onActive = item['path'];
        }
    });

    return links.map((item) => {
        if (item.type === 'item') {
            return (
                <NavItem key={item.name}>
                    <NavLink to={item.path} className={onActive === item.path ? "active" : ''}>
                        {item.icon}
                        <NavLinkName>{item.name}</NavLinkName>
                    </NavLink>
                </NavItem>
            )
        }
        return <NavHeading key={item.name}>{item.name}</NavHeading>
    })
}


// 侧边导航栏
function Siderbar() {
    const [links] = useState(NavgtionLinks);
    const location = useLocation();
    return (
        <PageSiderbar>
            {/* logo区域 */}
            <SiderHeader>
                <HeaderContent>
                    <Link to="/" style={LinkStyle}>围场小组件内容管理后台</Link>
                </HeaderContent>
            </SiderHeader>
            {/* 列表区域 */}
            <SiderContent>
                <NavMain>
                    {RenderNavItem({ links, location })}
                </NavMain>
            </SiderContent>
        </PageSiderbar>
    )
}

export default Siderbar;