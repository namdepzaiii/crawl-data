/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import { ConfigProvider, Table, Button, Form, Input, Modal } from 'antd';
import type { MenuProps } from 'antd';
import { Layout, Menu, notification } from 'antd';

const truncateText = (text, maxLength) => {
   return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

window.electron.ipcRenderer.on('success_crawl', (event) => {
   notification.success({
      message: 'Success',
      description: '+1 Post ^^ ',
      duration: 0.5,
      placement: 'top',
   });
});

const handleCellClick = (value) => {
   navigator.clipboard.writeText(value).then(() => {
      notification.success({
         message: 'Success',
         description: 'Copied to clipboard: ' + truncateText(value, 25),
         duration: 2,
         placement: 'top',
      });
   });
};

const { Header, Content, Sider } = Layout;

const start_handle = (values: any): void => {
   window.electron.ipcRenderer.send('start_handle', values);
};

// const items1: MenuProps['items'] = [
//    { key: 'home', label: 'Home' },
//    { key: 'setting', label: 'Cài đặt' },
// ];
const items1: MenuProps['items'] = [
   { key: 'home', label: <span className="menu-item menu-home">Home</span> },
   { key: 'setting', label: <span className="menu-item menu-setting">Cài đặt</span> },
];

const App: React.FC = () => {
   const [selectedKey, setSelectedKey] = useState('home');
   const [dataSource, setDataSource] = useState([]);
   const [form] = Form.useForm();
   const [settingsForm] = Form.useForm();
   const [settingsData, setSettingsData] = useState<any>(null);
   const [viewingPost, setViewingPost] = useState<any>(null);
   const [settings, setSettings] = useState<any>({}); // Trạng thái cho cài đặt

   useEffect(() => {
      window.electron.ipcRenderer.on('response_data', (event, data) => {
         const parsedData = JSON.parse(data);
         setDataSource(parsedData);
      });

      window.electron.ipcRenderer.send('request_settings');
      window.electron.ipcRenderer.on('response_settings', (event, data) => {
         const parsedSettings = JSON.parse(data);
         setSettingsData(parsedSettings);
         setSettings(parsedSettings); // Cập nhật trạng thái cài đặt
         settingsForm.setFieldsValue(parsedSettings);
      });

      return () => {
         window.electron.ipcRenderer.removeAllListeners('response_data');
         window.electron.ipcRenderer.removeAllListeners('response_settings');
      };
   }, [settingsForm]);

   useEffect(() => {
      if (selectedKey === 'setting') {
         settingsForm.setFieldsValue(settings); // Đặt giá trị biểu mẫu khi quay lại tab cài đặt
      }
   }, [selectedKey, settings, settingsForm]);

   const handleSettingsChange = (changedFields) => {
      const newSettings = { ...settings, ...changedFields }; // Kết hợp các cài đặt cũ và mới
      setSettings(newSettings); // Cập nhật trạng thái cài đặt
   };

   const columns = [
      {
         title: 'Title',
         dataIndex: 'title',
         key: 'title',
         render: (text) => (
            <div onClick={() => handleCellClick(text)} style={{ cursor: 'pointer' }}>
               {truncateText(text, 25)}
            </div>
         ),
      },
      {
         title: 'Href',
         dataIndex: 'href',
         key: 'href',
         render: (text) => (
            <div onClick={() => handleCellClick(text)} style={{ cursor: 'pointer' }}>
               {truncateText(text, 35)}
            </div>
         ),
      },
      {
         title: 'Content',
         dataIndex: 'content',
         key: 'content',
         render: (text) => (
            <div onClick={() => handleCellClick(text)} style={{ cursor: 'pointer' }}>
               {truncateText(text, 35)}
            </div>
         ),
      },
      {
         title: 'Action',
         key: 'action',
         render: (text: any, record: any) => (
            <>
               <Button onClick={() => handleView(record)} className="view_button">
                  Xem
               </Button>
               <Button onClick={() => handleDel(record.id_post)} className="del_button">
                  Xóa
               </Button>
            </>
         ),
      },
   ];

   const handleDel = (id_post) => {
      window.electron.ipcRenderer.send('delete_post', id_post);
      notification.info({
         message: 'Delete Post',
         description: `Post ID: ${id_post} has been deleted.`,
         duration: 2,
         placement: 'top',
      });
   };

   const handleView = (record) => {
      setViewingPost(record);
      Modal.info({
         title: record.title,
         content: (
            <div id="post-details">
                <p id="post-id"><strong>Id post:</strong> <span id="post-content">{record.id_post}</span></p>
                <p id="post-href"><strong>Href:</strong> <span id="post-content"><a href={record.href} target="_blank" rel="noopener noreferrer">{truncateText(record.href,75)}</a></span></p>
                <p id="post-code"><strong>Code:</strong> <span id="post-content">{record.id}</span></p>
                <p id="post-content"><strong>Content:</strong> <span id="post-content">{record.content}</span></p>
            </div>
            
         ),
         style: {
            minWidth: '800px',
         },
         onOk() {},
      });
   };

   const handleMenuClick = (e: any) => {
      setSelectedKey(e.key);
   };

   const handleStartClick = async () => {
      try {
         if (settings) {
            start_handle(settings); // Truyền cài đặt đã cập nhật
         } else {
            alert("Không có dữ liệu cài đặt.");
         }
      } catch (error) {
         console.log('Failed to get form values:', error);
      }
   };

const convert_handle = async () => {};
const stop_handle = (): void => {
   window.electron.ipcRenderer.send('stopWorker');
   };
const all_post_del = (): void => {
      window.electron.ipcRenderer.send('delete_post', 0);
      };
const hidemium_post = (): void => {
   window.electron.ipcRenderer.send('hidemium_post');
   };
         
   return (
      <ConfigProvider theme={{ token: { colorBgContainer: '#1e1e1e' } }}>
         <Layout className="app-layout">
            <Header className="app-header">
               <Menu
                  className="custom-app"
                  theme="dark"
                  mode="horizontal"
                  defaultSelectedKeys={['home']}
                  items={items1}
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={handleMenuClick}
               />
            </Header>
            <Layout>
               <Layout>
                  <Content
                     className="app-content"
                     style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: '#0a1a2b',
                     }}
                  >
                     {selectedKey === 'home' && (
                        <div id="text">
                           <h2>Danh sách bài viết</h2>
                           <Table
                              pagination={{ pageSize: 5 }}
                              className="custom-table"
                              dataSource={dataSource}
                              columns={columns}
                              rowKey="id"
                           />
                        </div>
                     )}

                     {selectedKey === 'setting' && (
                        <div>
                           <h2>Selector</h2>
                           <div className="scrollable-container">
                              <Form 
                                 form={settingsForm} 
                                 layout="horizontal" 
                                 onValuesChange={(_, allValues) => handleSettingsChange(allValues)}
                              >
                                 <Form.Item label={<span className="custom-label">Keyword</span>} name="keyword">
                                    <Input className="custom-input" />
                                 </Form.Item>
                                 <Form.Item label={<span className="custom-label">Url</span>} name="url">
                                    <Input className="custom-input" />
                                 </Form.Item>
                                 <Form.Item label={<span className="custom-label">couldn’t find any results</span>} name="couldnt_find">
                                    <Input className="custom-input" />
                                 </Form.Item>
                                 <Form.Item label={<span className="custom-label">postElements</span>} name="postElements">
                                    <Input className="custom-input" />
                                 </Form.Item>
                                 <Form.Item label={<span className="custom-label">Title</span>} name="title">
                                    <Input className="custom-input" />
                                 </Form.Item>
                                 <Form.Item label={<span className="custom-label">Href</span>} name="href">
                                    <Input className="custom-input" />
                                 </Form.Item>
                                 <Form.Item label={<span className="custom-label">Content</span>} name="content">
                                    <Input className="custom-input" />
                                 </Form.Item>
                              </Form>
                           </div>
                        </div>
                     )}
                  </Content>
               </Layout>

               <Sider width={240} className="app-sider">
                  <div style={{ padding: '16px' }}>
                     <button className="app-button" onClick={handleStartClick}>
                        Start
                     </button>
                     <button className="app-button" onClick={stop_handle}>
                        Stop
                     </button>
                     <button className="app-button" onClick={convert_handle}>
                        Convert
                     </button>
                     <button className="app-button" onClick={all_post_del}>
                        Xóa tất cả bài viết
                     </button>
                     <button className="app-button" onClick={hidemium_post}>
                        Đăng lên hidemium forum
                     </button>
                  </div>
               </Sider>
            </Layout>
         </Layout>
      </ConfigProvider>
   );
};

export default App;
