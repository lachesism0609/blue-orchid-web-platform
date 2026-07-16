export default function AuthDialog({
  open,
  lang,
  mode,
  loading,
  error,
  notice,
  email,
  verificationUrl,
  onClose,
  onSubmit,
  onResend,
  onSwitch,
}) {
  if (!open) return null;
  const login = mode === "login";
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
        <h2>
          {login
            ? lang === "zh"
              ? "欢迎回来"
              : "Welcome back"
            : lang === "zh"
              ? "创建账户"
              : "Create an account"}
        </h2>
        <p className="auth-caption">
          {login
            ? lang === "zh"
              ? "登录以查看您的专属内容。"
              : "Sign in to view your account."
            : lang === "zh"
              ? "注册后将生成邮箱验证链接。"
              : "A verification link will be generated after registration."}
        </p>
        <form onSubmit={onSubmit}>
          {!login && (
            <label>
              {lang === "zh" ? "姓名" : "Name"}
              <input name="name" required minLength="2" autoComplete="name" />
            </label>
          )}
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
          {notice && <p className="auth-notice">{notice}</p>}
          {verificationUrl && (
            <a className="auth-dev-verify" href={verificationUrl}>
              {lang === "zh"
                ? "开发演示：验证此邮箱"
                : "Demo: verify this email"}
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
          <button className="auth-submit" disabled={loading}>
            {loading
              ? lang === "zh"
                ? "请稍候…"
                : "Please wait…"
              : login
                ? lang === "zh"
                  ? "登录"
                  : "Sign in"
                : lang === "zh"
                  ? "注册"
                  : "Create account"}
          </button>
        </form>
        <button className="auth-switch" onClick={onSwitch}>
          {login
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
