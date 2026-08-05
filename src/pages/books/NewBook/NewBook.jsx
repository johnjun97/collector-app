import Navbar from '../../../components/Navbar'
import './NewBook.css'

export default function NewBook() {
    return (
        <>
            <Navbar section="书籍" />

            <main className="new-book-page">
                <div className="new-book-header">
                    <h1>新增书籍</h1>
                </div>

                <form className="new-book-form">
                    <div className="form-field">
                        <label htmlFor="title">书名</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="请输入书名"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="volume">集数</label>
                        <input
                            id="volume"
                            type="text"
                            placeholder="例如：1、2、3、全"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="author">作者</label>
                        <input
                            id="author"
                            type="text"
                            placeholder="请输入作者"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="subcategory">类型</label>
                        <select id="subcategory">
                            <option value="漫画">漫画</option>
                            <option value="小说">小说</option>
                            <option value="画集">画集</option>
                            <option value="设定集">设定集</option>
                            <option value="公式书">公式书</option>
                            <option value="同人志">同人志</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="edition">版本</label>
                        <input
                            id="edition"
                            type="text"
                            placeholder="例如：普通版、限定版、特装版"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="publisher">出版社</label>
                        <input
                            id="publisher"
                            type="text"
                            placeholder="请输入出版社"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="isbn">ISBN</label>
                        <input
                            id="isbn"
                            type="text"
                            placeholder="请输入 ISBN"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button">
                            取消
                        </button>

                        <button type="submit">
                            保存
                        </button>
                    </div>
                </form>
            </main>
        </>
    )
}