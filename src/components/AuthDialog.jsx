export default function AuthDialog({
  open,
  lang,
  mode,
  loading,
  error,
  notice,
  email,
  verificationUrl,
  resetUrl,
  onClose,
  onSubmit,
  onResend,
  onForgot,
  onSwitch,
}) {
  if (!open) return null;
  const login = mode === "login";
  const register = mode === "register";
  const forgot = mode === "forgot-password";
  const reset = mode === "reset-password";
  const heading = {
    login: ["欢迎回来", "Welcome back"],
    register: ["创建账户", "Create an account"],
    "forgot-password": ["找回密码", "Forgot password"],
    "reset-password": ["设置新密码", "Choose a new password"],
  }[mode];
  const caption = {
    login: ["登录以查看您的专属内容。", "Sign in to view your account."],
    register: [
      "注册后将生成邮箱验证链接。",
      "A verification link will be generated after registration.",
    ],
    "forgot-password": [
      "输入注册邮箱，我们会发送一小时内有效的重置链接。",
      "Enter your email and we will send a reset link valid for one hour.",
    ],
    "reset-password": [
      "设置新密码后，其他设备上的登录状态将全部失效。",
      "Setting a new password signs out every existing device.",
    ],
  }[mode];
  return (
    <div className="auth-backdrop" onMouseDown={onClose}>
      <section
        className="auth-dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="auth-kicker">BLUE ORCHID</p>
        <h2>{heading?.[lang === "zh" ? 0 : 1]}</h2>
        <p className="auth-caption">{caption?.[lang === "zh" ? 0 : 1]}</p>
        <form onSubmit={onSubmit}>
          {register && (
            <label>
              {lang === "zh" ? "姓名" : "Name"}
              <input name="name" required minLength="2" autoComplete="name" />
            </label>
          )}
          {!reset && (
            <label>
              {lang === "zh" ? "邮箱" : "Email"}
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={email}
              />
            </label>
          )}
          {!forgot && (
            <label>
              {lang === "zh" ? "密码" : "Password"}
              <input
                name="password"
                type="password"
                required
                minLength="8"
                autoComplete={login ? "current-password" : "new-password"}
              />
            </label>
          )}
          {reset && (
            <label>
              {lang === "zh" ? "确认新密码" : "Confirm new password"}
              <input
                name="confirmPassword"
                type="password"
                required
                minLength="8"
                autoComplete="new-password"
              />
            </label>
          )}
          {notice && <p className="auth-notice">{notice}</p>}
          {verificationUrl && (
            <a className="auth-dev-verify" href={verificationUrl}>
              {lang === "zh"
                ? "开发演示：验证此邮箱"
                : "Demo: verify this email"}
            </a>
          )}
          {resetUrl && (
            <a className="auth-dev-verify" href={resetUrl}>
              {lang === "zh"
                ? "开发演示：打开密码重置链接"
                : "Demo: open password reset link"}
            </a>
          )}
          {error && <p className="auth-error">{error}</p>}
          {email && login && (
            <button
              type="button"
              className="auth-resend"
              onClick={onResend}
              disabled={loading}
            >
              {lang === "zh"
                ? "重新生成验证链接"
                : "Generate a new verification link"}
            </button>
          )}
          {login && (
            <button type="button" className="auth-forgot" onClick={onForgot}>
              {lang === "zh" ? "忘记密码？" : "Forgot password?"}
            </button>
          )}
          <button className="auth-submit" disabled={loading}>
            {loading
              ? lang === "zh"
                ? "请稍候…"
                : "Please wait…"
              : mode === "login"
                ? lang === "zh"
                  ? "登录"
                  : "Sign in"
                : mode === "register"
                  ? lang === "zh"
                    ? "注册"
                    : "Create account"
                  : mode === "forgot-password"
                    ? lang === "zh"
                      ? "发送重置链接"
                      : "Send reset link"
                    : lang === "zh"
                      ? "更新密码"
                      : "Update password"}
          </button>
        </form>
        <button className="auth-switch" onClick={onSwitch}>
          {forgot || reset
            ? lang === "zh"
              ? "返回登录"
              : "Back to sign in"
            : login
              ? lang === "zh"
                ? "还没有账户？立即注册"
                : "New here? Create an account"
              : lang === "zh"
                ? "已有账户？直接登录"
                : "Already have an account? Sign in"}
        </button>
      </section>
    </div>
  );
}
