import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Testimonials.css";

/* Placeholder quotes — replace with real, attributable customer feedback
   before this page goes live. */
const QUOTES = [
  {
    quote:
      "Moving between crypto and equities used to mean two brokers and a two-day transfer. One balance killed that entirely.",
    name: "Marcus Reyes",
    role: "Independent trader, 9 years",
    initials: "MR",
  },
  {
    quote:
      "The fill quality is the part that surprised me. Limit orders sit where I put them and the book actually reflects what I get.",
    name: "Priya Nandakumar",
    role: "Systematic FX",
    initials: "PN",
  },
  {
    quote:
      "Bracket orders on entry mean I stop babysitting positions. I set the risk once and the platform holds me to it.",
    name: "Tom Aldridge",
    role: "Swing trader",
    initials: "TA",
  },
  {
    quote:
      "Withdrawal allowlists and hardware-key 2FA were non-negotiable for us. Nexa was the first that had both by default.",
    name: "Sofia Lindqvist",
    role: "Family office desk",
    initials: "SL",
  },
  {
    quote:
      "The depth ladder and the ticket sitting on the same screen sounds small until you size a position in a fast market.",
    name: "Daniel Okonkwo",
    role: "Futures and crypto",
    initials: "DO",
  },
  {
    quote:
      "I moved my whole book across on the API tier. Sandbox keys meant I could test the strategy before risking anything.",
    name: "Hannah Mercer",
    role: "Quant developer",
    initials: "HM",
  },
];

const Stars = () => (
  <span className="tst-stars" aria-label="Rated 5 out of 5">
    {Array.from({ length: 5 }, (_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
      </svg>
    ))}
  </span>
);

const Arrow = ({ dir }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);

const Testimonials = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Autoplay is motion the user did not ask for, so it is switched off
  // entirely when the OS reports a reduced-motion preference.
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="nx-sec tst-sec">
      <div className="nx-sec-glow nx-sec-glow--tl" />
      <div className="container">
        <div className="tst-top nx-reveal">
          <div className="nx-head nx-head--left tst-head">
            <span className="nx-eyebrow">
              <span className="nx-eyebrow-dot" />
              Traders
            </span>
            <h2 className="nx-title">
              Built on feedback from{" "}
              <span className="nx-grad">people who trade daily.</span>
            </h2>
          </div>

          {/* Controls live in the header rather than floating over the cards,
              so they never sit on top of a quote on narrow screens. */}
          <div className="tst-nav">
            <button
              type="button"
              className="tst-arrow"
              ref={prevRef}
              aria-label="Previous testimonials"
            >
              <Arrow dir="prev" />
            </button>
            <button
              type="button"
              className="tst-arrow"
              ref={nextRef}
              aria-label="Next testimonials"
            >
              <Arrow dir="next" />
            </button>
          </div>
        </div>

        <div className="tst-slider nx-reveal">
          <Swiper
            modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            grabCursor
            watchOverflow
            keyboard={{ enabled: true }}
            /* The buttons render before Swiper initialises, so the refs are
               still null in the `navigation` prop. Assigning them again in
               onBeforeInit is the documented way to bind custom controls. */
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={
              reduceMotion
                ? false
                : {
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
            }
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 24 },
            }}
            a11y={{
              prevSlideMessage: "Previous testimonials",
              nextSlideMessage: "Next testimonials",
            }}
          >
            {QUOTES.map((q) => (
              <SwiperSlide key={q.name}>
                <figure className="nx-card tst-card">
                  <Stars />
                  <blockquote className="tst-quote">"{q.quote}"</blockquote>
                  <figcaption className="tst-person">
                    <span className="tst-avatar">{q.initials}</span>
                    <span>
                      <span className="tst-name">{q.name}</span>
                      <span className="tst-role">{q.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
