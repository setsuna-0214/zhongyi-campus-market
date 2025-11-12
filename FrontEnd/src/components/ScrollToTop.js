import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'

  const positionsRef = useRef({});
  const tickingRef = useRef(false);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch (e) {}
    return () => {
      try {
        if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
          window.history.scrollRestoration = "auto";
        }
      } catch (e) {}
    };
  }, []);

  // 记录当前页面滚动位置，供后退/前进（POP）恢复
  useEffect(() => {
    const onScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(() => {
          const y = typeof window !== "undefined" ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;
          positionsRef.current[location.key] = y;
          tickingRef.current = false;
        });
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", onScroll);
      }
    };
  }, [location.key]);

  // 导航发生时，决定滚动行为：
  // - 首次渲染：顶部显示
  // - POP（后退/前进）：恢复到记录位置
  // - PUSH/REPLACE（进入新页面/替换）：顶部显示（不保留前页位置）
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    if (navigationType === "POP") {
      const saved = positionsRef.current[location.key];
      const y = typeof saved === "number" ? saved : 0;
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.key, navigationType]);

  return null;
};

export default ScrollToTop;