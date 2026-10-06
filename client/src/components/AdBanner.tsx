import React, { useEffect, useRef } from "react";
import { Sparkles, Megaphone } from "lucide-react";

interface AdBannerProps {
  client?: string;
  slot?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AdBanner({
  client = "ca-pub-2586618844394153",
  slot,
  className = "",
  style,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only attempt push once per mount and if element is present
    if (!pushedRef.current && adRef.current) {
      try {
        if (typeof window !== "undefined") {
          const adsbygoogle = ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
            (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []);
          adsbygoogle.push({});
          pushedRef.current = true;
        }
      } catch (err) {
        // Silently capture adblocker or duplicate ins errors in dev
        console.debug("AdSense push:", err);
      }
    }
  }, []);

  return (
    <div
      className={`ad-banner-box ${className}`}
      style={style}
      aria-label="Espaço de Publicidade Google AdSense"
    >
      <div className="ad-banner-header">
        <div className="ad-banner-badge">
          <Megaphone size={11} className="ad-badge-icon" />
          <span>PUBLICIDADE</span>
        </div>
        <span className="ad-provider-tag">Google AdSense</span>
      </div>

      <div className="ad-banner-content">
        {/* Google AdSense container */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          {...(slot ? { "data-ad-slot": slot } : {})}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Ambient fallback / placeholder shown in development or while loading */}
        <div className="ad-placeholder-layer" aria-hidden="true">
          <div className="ad-placeholder-glow" />
          <div className="ad-placeholder-inner">
            <div className="ad-placeholder-icon-wrap">
              <Sparkles size={16} />
            </div>
            <strong className="ad-placeholder-title">Google AdSense</strong>
            <p className="ad-placeholder-desc">
              Retângulo Responsivo
            </p>
            <span className="ad-placeholder-id">{client}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdBanner;
