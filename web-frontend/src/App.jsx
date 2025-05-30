import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "./App.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
const mytheme = atomDark;

function App() {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("init");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [index, setIndex] = useState(-1);
  const [uploadCount, setUploadCount] = useState(0);

  const fetchHistory = async (targetIndex = -1) => {
    setLoading(true);
    try {
      const res = await fetch(`/history?index=${targetIndex}`);
      const data = await res.json();
      if (res.ok) {
        setAnswer(data.answer);
        setIndex(data.index);
        setTotal(data.total);
        setStatus("ok");
        setError(null);
      } else {
        throw new Error(data.error || "获取历史回答失败");
      }
    } catch (e) {
      setError(e.message);
      setStatus("init");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (index > 0) fetchHistory(index - 1);
  };

  const handleNext = () => {
    if (index < total - 1) fetchHistory(index + 1);
  };

  //   useEffect(() => {
  //     fetchHistory(); // 初始加载
  //     const interval = setInterval(() => {
  //       fetchHistory(index);
  //     }, 5000);
  //     return () => clearInterval(interval);
  //   }, []);

  // useEffect(() => {
  //     // 初次加载最新历史回答
  //     fetchHistory();

  //     // 仅轮询最新一条，判断是否有新上传
  //     const interval = setInterval(async () => {
  //         try {
  //             const res = await fetch(`/history?index=-1`);
  //             const data = await res.json();

  //             if (res.ok) {
  //                 if (data.upload_count > uploadCount) {
  //                     setUploadCount(data.upload_count);
  //                     // 只更新到最新一条，不再受 index 限制
  //                     setAnswer(data.answer);
  //                     setIndex(data.index);
  //                     setTotal(data.total);
  //                     setStatus("ok");
  //                 }
  //             }
  //         } catch (e) {
  //             console.error("轮询出错:", e.message);
  //         }
  //     }, 5000);

  //     return () => clearInterval(interval);
  // }, [uploadCount]); // 只监听 uploadCount

  useEffect(() => {
    // 初始加载
    fetchHistory(); // 加载当前最新回答

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/history?index=-1`);
        const data = await res.json();

        if (res.ok && data.total > total) {
          // 总数变了，说明新截图上传，跳转到最新回答
          setIndex(data.index);
          setAnswer(data.answer);
          setTotal(data.total);
          setStatus("ok");
          setLoading(false);
        }
      } catch (e) {
        console.error("轮询出错:", e.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [total]);

  return (
    <div className="container">
      {/* <h1>📸 SnapMind: Snap·Ask·Know</h1> */}
      <h1 className="title">SnapMind: Snap·Ask·Know</h1>

      {loading && <p className="info">⏳ 正在加载回答...</p>}
      {error && <p className="error">❌ {error}</p>}

      {!loading && !error && status === "ok" && (
        <>
          <p className="tag">
            🎃 Total（{index + 1}/{total}）：
          </p>
          <div className="markdown">
            {/* <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            language={match[1]}
                                            style={mytheme}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {answer}
                        </ReactMarkdown> */}

            {/* <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            language={match[1]}
                                            style={mytheme}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {answer}
                        </ReactMarkdown> */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ node, inline, className = "", children, ...props }) {
                  const match = /language-(\w+)/.exec(className);
                  const lang = match?.[1];

                  // ✅ 更稳健：严格判断非 inline 且包含语言标签时使用高亮
                  if (!inline && lang && typeof children === "string") {
                    return (
                      <SyntaxHighlighter
                        language={lang}
                        style={mytheme}
                        PreTag="div"
                        {...props}
                      >
                        {children.replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    );
                  }

                  // ✅ fallback: 仅为行内代码或不含语言的 block 代码，保留默认样式
                  return (
                    <code
                      className={className}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {answer}
            </ReactMarkdown>
          </div>
          <div style={{ marginTop: "1em" }}>
            <button
              onClick={handlePrev}
              disabled={index <= 0}
            >
              ⬅ 上一条
            </button>
            <button
              onClick={handleNext}
              disabled={index >= total - 1}
              style={{ marginLeft: "10px" }}
            >
              下一条 ➡
            </button>
          </div>
        </>
      )}

      {!loading && !error && status === "init" && (
        <p className="info">
          📥 请先按下快捷键 <b>Ctrl + Shift + S</b> 截图，等待 AI 解答...
        </p>
      )}
    </div>
  );
}

export default App;
