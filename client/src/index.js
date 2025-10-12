import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { ConfigProvider } from 'antd';
import App from './App';
import './index.css';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </HashRouter>
); 