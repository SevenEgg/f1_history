import React, { useState, useEffect } from 'react';
import { Drawer, Button, Form, Input, Select, message, Space, Tag, Divider, Modal } from 'antd';
import { TAG_OPTIONS } from '../../../constants/tags';
import { EditOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MDEditor from '@uiw/react-md-editor';

const { TextArea } = Input;
const { Option } = Select;

const NewsManage = ({ visible, onClose, newsData, onPublish, onStatusUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [content, setContent] = useState('');
    const [newsDetail, setNewsDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadOssLoading, setUploadOssLoading] = useState(false);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [imagePreviewSrc, setImagePreviewSrc] = useState('');

    // 获取新闻详情
    const fetchNewsDetail = async (slug) => {
        if (!slug) return;
        
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/news/${slug}`);
            const result = await response.json();
            const data = result.data; // 从data字段获取实际数据
            setNewsDetail(data);
            
            // 设置表单数据
            form.setFieldsValue({
                title: data.title,
                summary: data.summary,
                cover_url: data.cover_url,
                published_at: data.published_at,
                news_source: data.news_source?.name || '',
                news_source_link: data.link_url || '',
                tags: data.news_types?.map(type => type.name) || []
            });
            setContent(data.content || '');
        } catch (error) {
            message.error('获取新闻详情失败');
            console.error('Error fetching news detail:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && newsData?.slug) {
            fetchNewsDetail(newsData.slug);
        }
    }, [visible, newsData?.slug]);

    // 清理 body 样式，防止 Drawer 关闭后影响页面滚动
    useEffect(() => {
        return () => {
            // 组件卸载时清理 body 样式
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, []);

    // 监听 visible 变化，确保关闭时清理样式
    useEffect(() => {
        if (!visible) {
            // Drawer 关闭时清理 body 样式
            setTimeout(() => {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 100);
        }
    }, [visible]);

    // 编辑态下，等待 newsDetail 异步返回后，再次尝试为 cover_url 进行预填
    useEffect(() => {
        if (!isEditing) return;
        const currentCover = form.getFieldValue('cover_url');
        if (!currentCover) {
            const fallbackCover = newsDetail?.cover_url || newsData?.cover_url || '';
            if (fallbackCover) {
                form.setFieldsValue({ cover_url: fallbackCover });
            }
        }
    }, [isEditing, newsDetail, newsData, form]);

    const handleEdit = () => {
        setIsEditing(true);
        // 进入编辑态时，若输入框为空，则使用原始封面链接进行预填
        const currentCover = form.getFieldValue('cover_url');
        console.log('currentCover', newsDetail?.cover_url,newsData?.cover_url);
        if (!currentCover) {
            const fallbackCover = newsDetail?.cover_url || newsData?.cover_url || '';
            if (fallbackCover) {
                form.setFieldsValue({ cover_url: fallbackCover });
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // 重置表单
        if (newsDetail) {
            form.setFieldsValue({
                title: newsDetail.title,
                summary: newsDetail.summary,
                cover_url: newsDetail.cover_url,
                published_at: newsDetail.published_at,
                news_source: newsDetail.news_source?.name || '',
                news_source_link: newsDetail.link_url || '',
                tags: newsDetail.news_types?.map(type => type.name) || []
            });
            setContent(newsDetail.content || '');
        }
    };

    const handlePublish = async () => {
        try {
            const values = await form.validateFields();
            const publishData = {
                slug: newsData.slug,
                cover_url: values.cover_url,
                published_at: values.published_at,
                news_source: values.news_source,
                news_source_link: values.news_source_link,
                title: values.title,
                summary: values.summary,
                content: content,
                tags: values.tags
            };

            const response = await fetch('http://localhost:3001/api/news/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(publishData)
            });

            if (response.ok) {
                await onPublish(publishData);
                setIsEditing(false);
                
                // 更新新闻状态为已采用
                if (onStatusUpdate) {
                    onStatusUpdate(newsData.slug, 'adopted');
                }
                
                // 更新本地newsData状态
                if (newsData) {
                    newsData.status = 'adopted';
                }
                
                message.success('新闻发布成功并已标记为采用');
            } else {
                const errorData = await response.json();
                message.error(errorData.error || '发布失败');
            }
        } catch (error) {
            message.error('发布失败，请检查表单');
            console.error('Error publishing news:', error);
        }
    };

    const renderContent = () => {
        return (
            <Form form={form} layout="vertical">
                <Form.Item
                    name="title"
                    label="标题"
                    rules={[{ required: true, message: '请输入标题' }]}
                >
                    <Input disabled={!isEditing} />
                </Form.Item>

                <Form.Item
                    name="summary"
                    label="摘要"
                    rules={[{ required: true, message: '请输入摘要' }]}
                >
                    <TextArea rows={3} disabled={!isEditing} />
                </Form.Item>

                <Form.Item
                    name="cover_url"
                    label="封面图片URL"
                >
                    <Input placeholder="请输入远程图片URL或已上传的URL" disabled={!isEditing} />
                </Form.Item>
                <Form.Item>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            onClick={async () => {
                                try {
                                    const remoteUrl = form.getFieldValue('cover_url');
                                    if (!remoteUrl) {
                                        message.warning('请先在输入框中填写远程图片URL');
                                        return;
                                    }
                                    setUploadOssLoading(true);
                                    const resp = await fetch('http://localhost:3001/api/upload-by-url', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ url: remoteUrl })
                                    });
                                    const data = await resp.json();
                                    if (resp.ok && data && data.url) {
                                        form.setFieldsValue({ cover_url: data.url });
                                        message.success('已上传到OSS并回填URL');
                                    } else {
                                        message.error(data && data.error ? data.error : '上传到OSS失败');
                                    }
                                } catch (e) {
                                    message.error('上传到OSS失败');
                                } finally {
                                    setUploadOssLoading(false);
                                }
                            }}
                            loading={uploadOssLoading}
                            disabled={!isEditing}
                        >
                            获取到OSS
                        </Button>
                        <Button
                            onClick={() => {
                                const src = form.getFieldValue('cover_url') || newsDetail?.cover_url || newsData?.cover_url || '';
                                if (!src) {
                                    message.warning('暂无可预览的图片链接');
                                    return;
                                }
                                setImagePreviewSrc(src);
                                setImagePreviewVisible(true);
                            }}
                            disabled={!isEditing}
                        >
                            预览图片
                        </Button>
                    </div>
                </Form.Item>

                <Form.Item
                    name="published_at"
                    label="发布时间"
                    rules={[{ required: true, message: '请输入发布时间' }]}
                >
                    <Input disabled={!isEditing} />
                </Form.Item>

                <Form.Item
                    name="news_source"
                    label="新闻来源"
                    rules={[{ required: true, message: '请输入新闻来源' }]}
                >
                    <Input disabled={!isEditing} />
                </Form.Item>

                <Form.Item
                    name="news_source_link"
                    label="新闻链接"
                >
                    <Input disabled={!isEditing} />
                </Form.Item>

                <Form.Item
                    name="tags"
                    label="标签"
                >
                    <Select mode="tags" placeholder="选择或输入标签" disabled={!isEditing}>
                        {TAG_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="内容">
                    <MDEditor
                        value={content}
                        onChange={setContent}
                        height={400}
                        data-color-mode="light"
                        hideToolbar={!isEditing}
                        preview={isEditing ? 'edit' : 'preview'}
                    />
                </Form.Item>
            </Form>
        );
    };

    const renderViewMode = () => {
        return (
            <div>
                    <div style={{ marginBottom: 16 }}>
                        <h2>{newsDetail?.title}</h2>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            发布时间: {newsDetail?.published_at ? new Date(newsDetail.published_at).toLocaleString('zh-CN') : ''}
                        </p>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            来源: {newsDetail?.news_source?.name || '未知来源'}
                        </p>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            状态: <Tag color={newsData?.status === 'adopted' ? 'green' : 'red'}>
                                {newsData?.status === 'adopted' ? '已采用' : '未采用'}
                            </Tag>
                            {newsData?.status === 'adopted' && (
                                <span style={{ color: '#999', marginLeft: 8 }}>(已采用状态不可编辑)</span>
                            )}
                        </p>
                        {newsDetail?.news_types && (
                            <div style={{ marginTop: 8 }}>
                                {newsDetail.news_types.map((type, index) => (
                                    <Tag key={index} color="blue">{type.name}</Tag>
                                ))}
                            </div>
                        )}
                    </div>

                    <Divider />
                    
                    <div style={{ marginBottom: 16 }}>
                        <h4>来源</h4>
                        <p>{newsDetail?.link_url || '未知来源'}</p>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <h4>摘要</h4>
                        <p>{newsDetail?.summary}</p>
                    </div>

                    {newsDetail?.cover_url && (
                        <div style={{ marginBottom: 16 }}>
                            <h4>封面图片</h4>
                            <img 
                                src={newsDetail.cover_url} 
                                alt="封面" 
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
                            />
                        </div>
                    )}

                    <div>
                        <h4>内容</h4>
                        <div style={{ 
                            border: '1px solid #d9d9d9', 
                            borderRadius: 4, 
                            padding: 16,
                            backgroundColor: '#fafafa'
                        }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {newsDetail?.content || '暂无内容'}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
        );
    };

    return (
        <>
            <Drawer
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{isEditing ? '编辑新闻' : '新闻详情'}</span>
                        <Space>
                            {isEditing ? (
                                <>
                                    <Button onClick={handleCancel} icon={<CloseOutlined />}>
                                        取消
                                    </Button>
                                    <Button type="primary" onClick={handlePublish} icon={<SendOutlined />}>
                                        发布
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    type="primary" 
                                    onClick={handleEdit} 
                                    icon={<EditOutlined />}
                                    disabled={newsData?.status === 'adopted'}
                                >
                                    编辑
                                </Button>
                            )}
                        </Space>
                    </div>
                }
                width={800}
                open={visible}
                onClose={onClose}
                destroyOnClose={false}
                maskClosable={true}
                zIndex={1000}
            >
                {isEditing ? renderContent() : renderViewMode()}
            </Drawer>
            
            <Modal
                open={imagePreviewVisible}
                title="图片预览"
                footer={null}
                onCancel={() => setImagePreviewVisible(false)}
                width={900}
                centered
                zIndex={1001}
            >
                {imagePreviewSrc ? (
                    <img
                        alt="cover preview"
                        src={imagePreviewSrc}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                ) : null}
            </Modal>
        </>
    );
};

export default NewsManage;
