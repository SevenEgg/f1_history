import React, { useState } from 'react';
import { Upload, Button, Image, Modal, message } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import superagent from 'superagent';

const { Dragger } = Upload;

const UploadContainer = styled.div`
  margin-bottom: 16px;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const ImageItem = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DeleteButton = styled(Button)`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.8);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: rgba(255, 0, 0, 1);
  }
`;

const ViewButton = styled(Button)`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

function ImageUpload({ value = [], onChange, disabled = false }) {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const response = await superagent
        .post('/api/upload')
        .attach('images', file);

      if (response.body.success) {
        const uploadedFile = response.body.files[0];
        if (uploadedFile.url) {
          const newImages = [...value, {
            url: uploadedFile.url,
            fileName: uploadedFile.fileName,
            originalName: uploadedFile.originalName
          }];
          onChange(newImages);
          message.success('图片上传成功');
        } else {
          message.error('图片上传失败');
        }
      } else {
        message.error('图片上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      message.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
    message.success('图片已删除');
  };

  const handlePreview = (image) => {
    setPreviewImage(image.url);
    setPreviewVisible(true);
  };

  const uploadProps = {
    name: 'images',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      handleUpload(file);
      return false; // 阻止默认上传行为
    },
    accept: 'image/*'
  };

  return (
    <UploadContainer>
      <Dragger {...uploadProps} disabled={disabled || uploading}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">
          {uploading ? '上传中...' : '点击或拖拽图片到此区域上传'}
        </p>
        <p className="ant-upload-hint">
          支持单个或批量上传，严禁上传公司数据或其他敏感文件
        </p>
      </Dragger>

      {value.length > 0 && (
        <ImagePreviewContainer>
          {value.map((image, index) => (
            <ImageItem key={index}>
              <ImagePreview src={image.url} alt={image.originalName} />
              <DeleteButton
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(index)}
                disabled={disabled}
              />
              <ViewButton
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(image)}
              />
            </ImageItem>
          ))}
        </ImagePreviewContainer>
      )}

      <Modal
        open={previewVisible}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </UploadContainer>
  );
}

export default ImageUpload; 