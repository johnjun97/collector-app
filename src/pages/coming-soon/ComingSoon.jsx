import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import './ComingSoon.css'


export default function ComingSoon({ section }) {

    const navigate = useNavigate()


    return (
        <>
            <Navbar section={section} />

            <main className="coming-soon-page">
                <div className="coming-soon-content">
                    <h1>功能开发中</h1>

                    <p>抱歉，目前此功能正在开发中。</p>
                    <p>感谢您的耐心等待，敬请期待后续更新。</p>

                    <button onClick={() => navigate('/home')}>
                        返回首页
                    </button>
                </div>
            </main>
        </>
    )


}