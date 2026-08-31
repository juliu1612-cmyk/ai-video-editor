import { Layout, Typography } from 'antd';
import Sidebar from './components/Sidebar';
import HomePage from './scenes/HomePage';
import VideoListPage from './scenes/VideoListPage';
import Scene1MixedCut from './scenes/Scene1MixedCut';
import Scene2MixedCutBgm from './scenes/Scene2MixedCutBgm';
import Scene3MixedCutTitle from './scenes/Scene3MixedCutTitle';
import Scene4ReplaceLogo from './scenes/Scene4ReplaceLogo';
import Scene5Watermark from './scenes/Scene5Watermark';
import Scene6Preface from './scenes/Scene6Preface';
import { useApp } from './context/AppContext';
import { ThunderboltFilled } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const sceneMap: Record<string, React.FC> = {
  scene1: Scene1MixedCut,
  scene2: Scene2MixedCutBgm,
  scene3: Scene3MixedCutTitle,
  scene4: Scene4ReplaceLogo,
  scene5: Scene5Watermark,
  scene6: Scene6Preface,
};

function App() {
  const { nav, setNav, activeScene, setActiveScene } = useApp();

  // 打开页面默认进入功能选择页(首页);hash 不再直达工作台

  const SceneComp = sceneMap[activeScene] ?? Scene1MixedCut;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f7f8fb' }}>
      {/* 侧边栏 */}
      <Sider
        width={72}
        collapsedWidth={72}
        style={{
          background: '#fff',
          borderRight: '1px solid #e5e7eb',
        }}
        trigger={null}
      >
        <Sidebar />
      </Sider>

      <Layout style={{ background: '#f7f8fb' }}>
        {/* 顶部 Header */}
        <Header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 24px',
            height: 56,
            lineHeight: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <ThunderboltFilled style={{ color: '#6366f1', fontSize: 22 }} />
          <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
            <span className="gradient-text">AI</span> 智能混剪
          </Title>
          <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 8 }}>
            让人工智能帮你剪视频
          </span>
        </Header>

        {/* 主内容区 */}
        <Content
          style={{
            padding: '16px 24px',
            background: '#f7f8fb',
            minHeight: 0,
          }}
        >
          {nav === 'home' && (
            <HomePage
              onStart={(scene: string) => {
                setActiveScene(scene);
                setNav('workbench');
              }}
            />
          )}
          {nav === 'workbench' && <SceneComp />}
          {nav === 'videos' && <VideoListPage />}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
