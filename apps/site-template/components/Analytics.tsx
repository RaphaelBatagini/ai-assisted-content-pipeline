import Head from 'next/head';
import { SiteData } from '../lib/types';

interface AnalyticsProps {
  site: SiteData;
}

export default function Analytics({ site }: AnalyticsProps) {
  return (
    <Head>
      {/* Google Tag Manager */}
      {site.gtmContainerId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${site.gtmContainerId}');`,
          }}
        />
      )}

      {/* Google Analytics */}
      {site.gaTrackingId && !site.gtmContainerId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${site.gaTrackingId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${site.gaTrackingId}');`,
            }}
          />
        </>
      )}

      {/* Meta Pixel */}
      {site.fbPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${site.fbPixelId}');
fbq('track', 'PageView');`,
          }}
        />
      )}

      {/* Custom head scripts */}
      {site.customHeadScripts && (
        <script
          dangerouslySetInnerHTML={{ __html: site.customHeadScripts }}
        />
      )}
    </Head>
  );
}
