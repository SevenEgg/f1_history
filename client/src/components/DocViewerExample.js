import React, { useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';

const DocViewerExample = () => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const docs = [
    {
      uri: 'https://manuscript-1323185299.cos.ap-beijing.myqcloud.com/0aea78b0-d727-44f3-87c8-94e01d351224_tmp_45975a3b68ac6829da0c8762a3ce26d5.doc',
      fileName: 'document.doc'
    }
  ];

  useEffect(() => {
    // 检查文档是否可访问
    fetch(docs[0].uri)
      .then(response => {
        if (!response.ok) {
          throw new Error('文档加载失败');
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Document fetch error:', error);
        setError('加载文档时出错，请检查文档链接是否可访问');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {error ? (
        <div style={{ padding: '20px', color: 'red' }}>{error}</div>
      ) : (
        <DocViewer
          documents={docs}
          pluginRenderers={DocViewerRenderers}
          style={{ width: '100%', height: '100%' }}
          config={{
            header: {
              disableHeader: false,
              disableFileName: false,
              retainURLParams: false
            }
          }}
        />
      )}
    </div>
  );
};

export default DocViewerExample; 