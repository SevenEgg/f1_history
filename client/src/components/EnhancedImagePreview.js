import React, { useState } from 'react';
import { Image, Modal, Button, Space, message } from 'antd';
import { EyeOutlined, DownloadOutlined, FullscreenOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  margin: 4px;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #1890ff;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    
    .image-overlay {
      opacity: 1;
    }
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
`;

const ImageActions = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${ImageWrapper}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled(Button)`
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: white;
    transform: scale(1.1);
  }
`;

const FullscreenModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(0, 0, 0, 0.9);
    border-radius: 0;
  }
  
  .ant-modal-header {
    background: transparent;
    border-bottom: none;
  }
  
  .ant-modal-title {
    color: white;
  }
  
  .ant-modal-close {
    color: white;
  }
  
  .ant-modal-body {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    max-height: 90vh;
    overflow: hidden;
  }
`;

const FullscreenImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
`;

function EnhancedImagePreview({ images = [], title = '图片预览' }) {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setFullscreenVisible(true);
  };

  const handleDownload = (image, event) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.originalName || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('图片下载成功');
  };

  const handleFullscreen = (index, event) => {
    event.stopPropagation();
    setCurrentImageIndex(index);
    setFullscreenVisible(true);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      handlePrev();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'Escape') {
      setFullscreenVisible(false);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold', color: '#666' }}>图片 ({images.length}张)：</span>
      </div>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 8,
        maxWidth: '100%'
      }}>
        {images.map((image, index) => (
          <ImageContainer key={index}>
            <ImageWrapper onClick={() => handleImageClick(index)}>
              <StyledImage 
                src={image.url} 
                alt={image.originalName}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f5f5f5',
                  color: '#999',
                  fontSize: '12px'
                }}
              >
                图片加载失败
              </div>
              <ImageOverlay className="image-overlay">
                <EyeOutlined style={{ color: 'white', fontSize: '20px' }} />
              </ImageOverlay>
              <ImageActions>
                <ActionButton
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={(e) => handleDownload(image, e)}
                  title="下载图片"
                />
                <ActionButton
                  size="small"
                  icon={<FullscreenOutlined />}
                  onClick={(e) => handleFullscreen(index, e)}
                  title="全屏查看"
                />
              </ImageActions>
            </ImageWrapper>
          </ImageContainer>
        ))}
      </div>

      <FullscreenModal
        title={`${title} - ${currentImageIndex + 1}/${images.length}`}
        open={fullscreenVisible}
        onCancel={() => setFullscreenVisible(false)}
        footer={null}
        width="95vw"
        style={{ top: 10 }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        centered
      >
        <div style={{ 
          position: 'relative', 
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          maxHeight: '85vh'
        }}>
          <FullscreenImage
            src={images[currentImageIndex]?.url}
            alt={images[currentImageIndex]?.originalName}
            style={{
              maxWidth: 'calc(100vw - 100px)',
              maxHeight: 'calc(100vh - 200px)',
              objectFit: 'contain'
            }}
          />
          
          {images.length > 1 && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<span>‹</span>}
                size="large"
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: 'none'
                }}
                onClick={handlePrev}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<span>›</span>}
                size="large"
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: 'none'
                }}
                onClick={handleNext}
              />
            </>
          )}
          
          <div style={{ 
            position: 'absolute', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '8px 16px',
            borderRadius: '20px',
            color: 'white'
          }}>
            <Space>
              <span>使用 ← → 键切换图片，ESC 键关闭</span>
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(images[currentImageIndex], { stopPropagation: () => {} })}
              >
                下载
              </Button>
            </Space>
          </div>
        </div>
      </FullscreenModal>
    </div>
  );
}

export default EnhancedImagePreview; 