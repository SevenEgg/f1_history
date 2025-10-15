import React, { useState, useEffect } from 'react';
import { Drawer, Button, Form, Input, Select, message, Space, Tag, Divider, Modal, Upload } from 'antd';
import { TAG_OPTIONS } from '../../../constants/tags';
import { EditOutlined, SendOutlined, CloseOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MDEditor from '@uiw/react-md-editor';

const { TextArea } = Input;
const { Option } = Select;

const NewsManage = ({ visible, onClose, newsData, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadOssLoading, setUploadOssLoading] = useState(false);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [imagePreviewSrc, setImagePreviewSrc] = useState('');

    // 初始化表单数据
    useEffect(() => {
        if (newsData && visible) {
            form.setFieldsValue({
                title: newsData.title,
                summary: newsData.summary,
                cover_url: newsData.cover_url,
                published_at: newsData.published_at,
                news_source: newsData.news_source,
                news_source_link: newsData.news_source_link,
                tags: newsData.tags || []
            });
            setContent(newsData.content || '');
        }
    }, [newsData, visible, form]);

    // 编辑模式切换
    const handleEdit = () => {
        setIsEditing(true);
        // 预填封面图片URL
        const currentCover = form.getFieldValue('cover_url');
        if (!currentCover) {
            const fallbackCover = newsData?.cover_url || '';
            if (fallbackCover) {
                form.setFieldsValue({ cover_url: fallbackCover });
            }
        }
    };

    // 取消编辑
    const handleCancel = () => {
        setIsEditing(false);
        // 重置表单数据
        if (newsData) {
            form.setFieldsValue({
                title: newsData.title,
                summary: newsData.summary,
                cover_url: newsData.cover_url,
                published_at: newsData.published_at,
                news_source: newsData.news_source,
                news_source_link: newsData.news_source_link,
                tags: newsData.tags || []
            });
            setContent(newsData.content || '');
        }
    };

    // 保存更新
    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            const updateData = {
                cover_url: values.cover_url,
                published_at: values.published_at,
                news_source: values.news_source,
                news_source_link: values.news_source_link,
                title: values.title,
                summary: values.summary,
                content: content,
                tags: values.tags || []
            };

            setLoading(true);
            const response = await fetch(`http://localhost:3001/api/published-news/${newsData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (response.ok) {
                message.success('新闻更新成功');
                setIsEditing(false);
                if (onUpdate) {
                    onUpdate(updateData);
                }
            } else {
                message.error(result.error || '更新失败');
            }
        } catch (error) {
            message.error('更新失败，请检查表单');
            console.error('Error updating news:', error);
        } finally {
            setLoading(false);
        }
    };

    // 文件上传到OSS
    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('images', file);

        setUploadOssLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            
            if (response.ok && result.success && result.files && result.files.length > 0) {
                const uploadedFile = result.files[0];
                if (uploadedFile.url) {
                    form.setFieldsValue({ cover_url: uploadedFile.url });
                    message.success('图片上传到OSS成功');
                } else {
                    message.error(uploadedFile.error || '图片上传失败');
                }
            } else {
                message.error(result.error || '图片上传失败');
            }
        } catch (error) {
            message.error('图片上传失败');
            console.error('Error uploading file:', error);
        } finally {
            setUploadOssLoading(false);
        }
        
        return false; // 阻止默认上传行为
    };

    // 上传前验证
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件!');
            return false;
        }
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('图片大小不能超过 10MB!');
            return false;
        }
        return true;
    };

    // 预览图片
    const handlePreviewImage = () => {
        const currentCoverUrl = form.getFieldValue('cover_url') || newsData?.cover_url || '';
        if (currentCoverUrl) {
            setImagePreviewSrc(currentCoverUrl);
            setImagePreviewVisible(true);
        } else {
            message.warning('暂无可预览的图片链接');
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
                        <Upload
                            beforeUpload={beforeUpload}
                            customRequest={({ file }) => handleFileUpload(file)}
                            showUploadList={false}
                            disabled={!isEditing}
                        >
                            <Button
                                icon={<UploadOutlined />}
                                loading={uploadOssLoading}
                                disabled={!isEditing}
                            >
                                上传图片
                            </Button>
                        </Upload>
                        <Button
                            onClick={handlePreviewImage}
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
                    <h2>{newsData?.title}</h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        发布时间: {newsData?.published_at ? new Date(newsData.published_at).toLocaleString('zh-CN') : ''}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        来源: {newsData?.news_source || '未知来源'}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        创建时间: {newsData?.created_at ? new Date(newsData.created_at).toLocaleString('zh-CN') : ''}
                    </p>
                    {newsData?.tags && newsData.tags.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            {newsData.tags.map((tag, index) => (
                                <Tag key={index} color="blue">{tag}</Tag>
                            ))}
                        </div>
                    )}
                </div>

                <Divider />

                <div style={{ marginBottom: 16 }}>
                    <h4>摘要</h4>
                    <p>{newsData?.summary}</p>
                </div>

                {newsData?.cover_url && (
                    <div style={{ marginBottom: 16 }}>
                        <h4>封面图片</h4>
                        <img 
                            src={newsData.cover_url} 
                            alt="封面" 
                            style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
                        />
                    </div>
                )}

                <div>
                    <h4>内容</h4>
                    <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: 6, 
                        padding: 16, 
                        backgroundColor: '#fafafa',
                        minHeight: 200
                    }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {newsData?.content || '暂无内容'}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    };

    return (
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
                                <Button 
                                    type="primary" 
                                    onClick={handleUpdate} 
                                    icon={<SendOutlined />}
                                    loading={loading}
                                >
                                    保存
                                </Button>
                            </>
                        ) : (
                            <Button 
                                type="primary" 
                                onClick={handleEdit} 
                                icon={<EditOutlined />}
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
            destroyOnClose
        >
            <Modal
                open={imagePreviewVisible}
                footer={null}
                onCancel={() => setImagePreviewVisible(false)}
                width={900}
                centered
            >
                {imagePreviewSrc ? (
                    <img
                        alt="cover preview"
                        src={imagePreviewSrc}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                ) : null}
            </Modal>
            {isEditing ? renderContent() : renderViewMode()}
        </Drawer>
    );
};

export default NewsManage;
