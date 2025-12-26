import React, { useRef, useState, useEffect } from 'react';
import './index.css';

/**
 * 6位验证码输入组件
 * 支持键盘输入、粘贴、退格删除
 */
const VerificationCodeInput = ({ value = '', onChange, disabled = false }) => {
  const [codes, setCodes] = useState(Array(6).fill(''));
  const inputRefs = useRef([]);

  // 同步外部value到内部状态
  useEffect(() => {
    if (value) {
      const chars = value.slice(0, 6).split('');
      const newCodes = Array(6).fill('').map((_, i) => chars[i] || '');
      setCodes(newCodes);
    } else {
      setCodes(Array(6).fill(''));
    }
  }, [value]);

  // 通知父组件值变化
  const notifyChange = (newCodes) => {
    const newValue = newCodes.join('');
    onChange?.(newValue);
  };

  // 处理单个输入
  const handleInput = (index, e) => {
    const inputValue = e.target.value;
    
    // 只允许数字
    if (inputValue && !/^\d$/.test(inputValue)) {
      return;
    }

    const newCodes = [...codes];
    newCodes[index] = inputValue;
    setCodes(newCodes);
    notifyChange(newCodes);

    // 自动跳转到下一个输入框
    if (inputValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // 处理键盘事件
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!codes[index] && index > 0) {
        // 当前框为空时，删除上一个框的内容并聚焦
        const newCodes = [...codes];
        newCodes[index - 1] = '';
        setCodes(newCodes);
        notifyChange(newCodes);
        inputRefs.current[index - 1]?.focus();
      } else {
        // 清空当前框
        const newCodes = [...codes];
        newCodes[index] = '';
        setCodes(newCodes);
        notifyChange(newCodes);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // 处理粘贴
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // 提取数字
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits) {
      const newCodes = Array(6).fill('').map((_, i) => digits[i] || '');
      setCodes(newCodes);
      notifyChange(newCodes);
      
      // 聚焦到最后一个有值的输入框的下一个，或最后一个
      const lastFilledIndex = Math.min(digits.length, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  // 处理聚焦 - 选中内容
  const handleFocus = (index) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className="verification-code-input" onPaste={handlePaste}>
      {codes.map((code, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code}
          disabled={disabled}
          className={`code-box ${code ? 'filled' : ''}`}
          onChange={(e) => handleInput(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};

export default VerificationCodeInput;
