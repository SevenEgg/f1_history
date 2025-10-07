import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Space,
  DatePicker,
  Typography,
  Divider,
  message,
  Card,
  Select
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import superagent from 'superagent';
import dayjs from 'dayjs';
import ImageUpload from './ImageUpload';

const { TextArea } = Input;
const { Title } = Typography;

const RecordSection = styled.div`
  margin-bottom: 24px;
`;

const RecordItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
`;

const RecordInput = styled(Input)`
  flex: 1;
`;

const RecordTextArea = styled(TextArea)`
  flex: 2;
`;

function PostForm({ visible, onClose, postId, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [recordsEn, setRecordsEn] = useState([]);
  const [recordsCn, setRecordsCn] = useState([]);
  const [deaths, setDeaths] = useState([]);
  const [champions, setChampions] = useState([]);

  const isEdit = !!postId;

  const fetchPost = async () => {
    setInitialLoading(true);
    try {
      const response = await superagent.get(`/api/posts/${postId}`);
      const post = response.body;

      // 从完整日期中提取月-日部分
      const dateParts = post.date.split('-');
      const monthDay = `${dateParts[1]}-${dateParts[2]}`;

      form.setFieldsValue({
        summary: post.summary,
        date: dayjs(monthDay, 'MM-DD')
      });

      setRecordsEn(post.records_en || []);
      setRecordsCn(post.records_cn || []);
      setDeaths(post.deaths || []);
      setChampions(post.champions || []);
    } catch (error) {
      message.error('获取帖子信息失败');
      console.error('Error fetching post:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit && visible) {
      fetchPost();
    }
  }, [postId, isEdit, visible]);

  const addRecordEn = () => {
    setRecordsEn([...recordsEn, { year: '', content: '' }]);
  };

  const removeRecordEn = (index) => {
    const newRecords = recordsEn.filter((_, i) => i !== index);
    setRecordsEn(newRecords);
  };

  const updateRecordEn = (index, field, value) => {
    const newRecords = [...recordsEn];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setRecordsEn(newRecords);
  };

  const addRecordCn = () => {
    setRecordsCn([...recordsCn, { year: '', content: '' }]);
  };

  const removeRecordCn = (index) => {
    const newRecords = recordsCn.filter((_, i) => i !== index);
    setRecordsCn(newRecords);
  };

  const updateRecordCn = (index, field, value) => {
    const newRecords = [...recordsCn];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setRecordsCn(newRecords);
  };

  const updateRecordImages = (records, setRecords, index, images) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], images };
    setRecords(newRecords);
  };

  // Deaths 管理函数
  const addDeath = () => {
    setDeaths([...deaths, { type: 'driver', name_en: '', name_cn: '', entity_id: '' }]);
  };

  const removeDeath = (index) => {
    const newDeaths = deaths.filter((_, i) => i !== index);
    setDeaths(newDeaths);
  };

  const updateDeath = (index, field, value) => {
    const newDeaths = [...deaths];
    newDeaths[index] = { ...newDeaths[index], [field]: value };
    setDeaths(newDeaths);
  };

  // Champion 管理函数
  const addChampion = () => {
    setChampions([...champions, { type: 'driver', name_en: '', name_cn: '', entity_id: '' }]);
  };

  const removeChampion = (index) => {
    const newChampions = champions.filter((_, i) => i !== index);
    setChampions(newChampions);
  };

  const updateChampion = (index, field, value) => {
    const newChampions = [...champions];
    newChampions[index] = { ...newChampions[index], [field]: value };
    setChampions(newChampions);
  };

  const handleClose = () => {
    form.resetFields();
    setRecordsEn([]);
    setRecordsCn([]);
    setDeaths([]);
    setChampions([]);
    setLoading(false);
    setInitialLoading(false);
    onClose();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const postDate = `${currentYear}-${values.date.format('MM-DD')}`;
      const postData = {
        summary: values.summary,
        date: postDate,
        records_en: recordsEn.filter(record => record.year && record.content),
        records_cn: recordsCn.filter(record => record.year && record.content)
      };

      if (isEdit) {
        await superagent.put(`/api/posts/${postId}`).send(postData);
        
        // 编辑模式下，先删除原有的 Deaths 和 Champion 记录，再添加新的
        // 获取原有记录
        const postResponse = await superagent.get(`/api/posts/${postId}`);
        const existingPost = postResponse.body;
        
        // 删除原有的 Deaths 记录
        for (const death of existingPost.deaths || []) {
          await superagent.delete(`/api/deaths/${death.id}`);
        }
        
        // 删除原有的 Champion 记录
        for (const champion of existingPost.champions || []) {
          await superagent.delete(`/api/champions/${champion.id}`);
        }
        
        // 添加新的 Deaths 记录
        for (const death of deaths.filter(d => d.name_en && d.name_cn && d.entity_id)) {
          await superagent.post('/api/deaths').send({
            ...death,
            date: postDate
          });
        }

        // 添加新的 Champion 记录
        for (const champion of champions.filter(c => c.name_en && c.name_cn && c.entity_id)) {
          await superagent.post('/api/champions').send({
            ...champion,
            date: postDate
          });
        }
        
        message.success('帖子更新成功');
      } else {
        const response = await superagent.post('/api/posts').send(postData);
        const newPostId = response.body.id;
        
        // 保存 Deaths 记录
        for (const death of deaths.filter(d => d.name_en && d.name_cn && d.entity_id)) {
          await superagent.post('/api/deaths').send({
            ...death,
            date: postDate
          });
        }

        // 保存 Champion 记录
        for (const champion of champions.filter(c => c.name_en && c.name_cn && c.entity_id)) {
          await superagent.post('/api/champions').send({
            ...champion,
            date: postDate
          });
        }
        
        message.success('帖子添加成功');
      }

      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      message.error(isEdit ? '更新失败' : '添加失败');
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRecordSection = (records, setRecords, addRecord, removeRecord, updateRecord, title, color) => (
    <RecordSection>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color }}>{title}</Title>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addRecord}
        >
          添加记录
        </Button>
      </div>

      {records.map((record, index) => (
        <Card key={index} size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <RecordInput
              placeholder="年份"
              value={record.year}
              onChange={(e) => updateRecord(index, 'year', e.target.value)}
              style={{ width: 100 }}
            />
            <RecordTextArea
              placeholder="内容"
              value={record.content}
              onChange={(e) => updateRecord(index, 'content', e.target.value)}
              rows={2}
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRecord(index)}
            />
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>图片：</div>
            <ImageUpload
              value={record.images || []}
              onChange={(images) => updateRecordImages(records, setRecords, index, images)}
            />
          </div>
        </Card>
      ))}
    </RecordSection>
  );

  const renderCategorySection = (items, setItems, addItem, removeItem, updateItem, title, color) => (
    <RecordSection>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color }}>{title}</Title>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addItem}
        >
          添加{title}
        </Button>
      </div>

      {items.map((item, index) => (
        <Card key={index} size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Select
              value={item.type}
              onChange={(value) => updateItem(index, 'type', value)}
              style={{ width: 100 }}
            >
              <Select.Option value="driver">车手</Select.Option>
              <Select.Option value="team">车队</Select.Option>
            </Select>
            <Input
              placeholder="英文名"
              value={item.name_en}
              onChange={(e) => updateItem(index, 'name_en', e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              placeholder="中文名"
              value={item.name_cn}
              onChange={(e) => updateItem(index, 'name_cn', e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              placeholder="实体ID"
              value={item.entity_id}
              onChange={(e) => updateItem(index, 'entity_id', e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeItem(index)}
            />
          </div>
        </Card>
      ))}
    </RecordSection>
  );

  return (
    <Drawer
      title={isEdit ? '编辑帖子' : '新增帖子'}
      width={720}
      open={visible}
      onClose={handleClose}
      destroyOnClose
      loading={initialLoading}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
              icon={<SaveOutlined />}
            >
              {isEdit ? '更新' : '保存'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          date: dayjs()
        }}
      >
        <Form.Item
          label="简介"
          name="summary"
          rules={[
            { required: true, message: '请输入简介' },
            { max: 100, message: '简介不能超过100字' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="请输入简介（100字以内）"
            showCount
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          label="日期"
          name="date"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="MM-DD"
            picker="date"
            placeholder="选择日期"
          />
        </Form.Item>

        <Divider />

        {renderRecordSection(
          recordsEn,
          setRecordsEn,
          addRecordEn,
          removeRecordEn,
          updateRecordEn,
          '英文记录',
          '#1890ff'
        )}

        {renderRecordSection(
          recordsCn,
          setRecordsCn,
          addRecordCn,
          removeRecordCn,
          updateRecordCn,
          '中文记录',
          '#52c41a'
        )}

        <Divider />

        {renderCategorySection(
          deaths,
          setDeaths,
          addDeath,
          removeDeath,
          updateDeath,
          '车手/车队',
          '#ff4d4f'
        )}

        {renderCategorySection(
          champions,
          setChampions,
          addChampion,
          removeChampion,
          updateChampion,
          '车手/车队冠军',
          '#faad14'
        )}
      </Form>
    </Drawer>
  );
}

export default PostForm; 