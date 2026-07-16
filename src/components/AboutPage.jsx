export default function AboutPage({ open, lang }) {
  if (!open) return null;
  const zh = lang === "zh";
  return (
    <div className="about-brand-page">
      <article className="about-brand-shell">
        <section className="about-hero">
          <div>
            <p className="about-eyebrow">BLUE ORCHID · EST. 2026</p>
            <h1>
              {zh ? (
                <>
                  让日常穿着，
                  <br />
                  自然地成为风格
                </>
              ) : (
                <>
                  Everyday ease,
                  <br />
                  distinctive style
                </>
              )}
            </h1>
            <p>
              {zh
                ? "我们以兰花的从容与韧性为灵感，创作轻盈、舒适且经得起时间考验的衣橱单品。"
                : "Inspired by the quiet strength of the orchid, we create light, comfortable pieces designed to endure."}
            </p>
            <a href="mailto:service@blueorchid.com">
              {zh ? "联系我们" : "Contact us"} →
            </a>
          </div>
          <img
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=88"
            alt="Blue Orchid collection"
          />
        </section>
        <section className="about-story">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=88"
            alt="Fashion design"
          />
          <div>
            <p className="about-eyebrow">{zh ? "我们的故事" : "OUR STORY"}</p>
            <h2>
              {zh
                ? "少一点喧闹，多一点真正的舒适"
                : "Less noise, more considered comfort"}
            </h2>
            <p>
              {zh
                ? "Blue Orchid 始于一个简单的想法：好衣服不应该让人费力。我们从面料触感、剪裁比例和真实生活出发，让每件衣服都能轻松融入日常。"
                : "Blue Orchid began with a simple belief: good clothes should never feel difficult. We start with touch, proportion and real life."}
            </p>
          </div>
        </section>
        <section className="about-values">
          <header>
            <p className="about-eyebrow">
              {zh ? "我们在意的事" : "WHAT MATTERS TO US"}
            </p>
            <h2>
              {zh
                ? "从一件衣服，开始更好的日常"
                : "A better everyday starts with one good piece"}
            </h2>
          </header>
          <div>
            {[
              [
                zh ? "舒适面料" : "Comfort first",
                zh
                  ? "柔软、透气，适合长时间穿着。"
                  : "Soft, breathable materials selected for all-day wear.",
              ],
              [
                zh ? "长久设计" : "Made to last",
                zh
                  ? "让剪裁与配色经得起时间。"
                  : "Timeless cuts and colours beyond short-lived trends.",
              ],
              [
                zh ? "贴心服务" : "Human service",
                zh
                  ? "从选购到退换，以清晰友好的方式回应。"
                  : "Clear, friendly support from choice to returns.",
              ],
            ].map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="about-contact">
          <div className="about-contact-image">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=88"
              alt="Blue Orchid studio"
            />
          </div>
          <div>
            <p className="about-eyebrow">{zh ? "客户服务" : "CUSTOMER CARE"}</p>
            <h2>
              {zh ? "我们很乐意听到你的声音" : "We'd love to hear from you"}
            </h2>
            <p>
              {zh
                ? "关于尺码、商品、订单或退换货，请联系我们的客服团队。"
                : "For sizing, products, orders or returns, our customer care team is ready to help."}
            </p>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href="mailto:service@blueorchid.com">
                    service@blueorchid.com
                  </a>
                </dd>
              </div>
              <div>
                <dt>{zh ? "电话" : "Phone"}</dt>
                <dd>
                  <a href="tel:+864008002026">+86 400 800 2026</a>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </article>
    </div>
  );
}
