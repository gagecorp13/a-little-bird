"use client";
import { useId } from "react";
const source = "/artwork/homepage-final.png";
function CutoutFilter({ id }: { id: string }) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -5 5 0 0 2" />
    </filter>
  );
}
export function SceneArtwork() {
  const id = useId().replaceAll(":", "");
  return (
    <svg className="scene-art" viewBox="0 0 1448 1086" aria-hidden="true" focusable="false">
      <defs>
        <CutoutFilter id={id + "color"} />
        <mask id={id}>
          <rect width="1448" height="1086" fill="white" />
          <path
            d="M0 70H475V180H0ZM57 190H514V231H57ZM710 276H1320V866H710ZM0 1033H1448V1086H0Z"
            fill="black"
          />
          <path
            d="M1110 176L1139 170C1148 146 1147 120 1175 119L1175 110L1180 116L1185 110L1185 120C1197 121 1201 129 1199 133L1210 131L1200 138L1208 143L1196 144C1194 162 1189 173 1171 179L1173 195L1180 200L1170 201L1167 180L1162 181L1162 200L1156 200L1158 178L1139 178L1126 184L1110 184L1121 180Z"
            fill="black"
          />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <image href={source} width="1448" height="1086" filter={`url(#${id}color)`} />
      </g>
    </svg>
  );
}
export function Wordmark() {
  const id = useId().replaceAll(":", "");
  return (
    <header className="wordmark">
      <h1>
        <span className="sr-only">a little bird.com</span>
        <svg viewBox="48 65 470 165" aria-hidden="true">
          <defs>
            <CutoutFilter id={id + "color"} />
            <clipPath id={id}>
              <path d="M50 72H474V180H50ZM57 190H514V231H57Z" />
            </clipPath>
          </defs>
          <image
            href={source}
            width="1448"
            height="1086"
            filter={`url(#${id}color)`}
            clipPath={`url(#${id})`}
          />
        </svg>
      </h1>
      <p className="sr-only">some things are better left unsigned.</p>
    </header>
  );
}
export function Bird({ flying = false }: { flying?: boolean }) {
  const id = useId().replaceAll(":", "");
  return (
    <div className={`bird ${flying ? "bird-flying" : ""}`} aria-hidden="true">
      <svg viewBox="1105 106 106 99">
        <defs>
          <CutoutFilter id={id + "color"} />
          <clipPath id={id}>
            <path d="M1110 176 L1139 170 C1148 146 1147 120 1175 119 L1175 110 L1180 116 L1185 110 L1185 120 C1197 121 1201 129 1199 133 L1210 131 L1200 138 L1208 143 L1196 144 C1194 162 1189 173 1171 179 L1173 195 L1180 200 L1170 201 L1167 180 L1162 181 L1162 200 L1156 200 L1158 178 L1139 178 L1126 184 L1110 184 L1121 180 Z" />
          </clipPath>
        </defs>
        <image
          href={source}
          width="1448"
          height="1086"
          filter={`url(#${id}color)`}
          clipPath={`url(#${id})`}
        />
      </svg>
      <svg className="delivery-envelope" viewBox="0 0 50 34">
        <path d="M2 4L47 2 49 31 1 32Z" fill="#f7f1e3" stroke="#241c15" strokeWidth="1.5" />
        <path d="M2 4L26 21 47 2M1 32L18 17M49 31L33 17" fill="none" stroke="#241c15" />
      </svg>
    </div>
  );
}
export function PaperFrame({ kind = "message" }: { kind?: "recipient" | "message" | "button" }) {
  const id = useId().replaceAll(":", "");
  const box =
    kind === "button"
      ? "850 740 280 115"
      : kind === "recipient"
        ? "725 304 527 137"
        : "726 484 577 250";
  const blank =
    kind === "recipient"
      ? "M767 359L1211 333 1215 391 771 415Z"
      : kind === "message"
        ? "M760 536L1236 520 1259 682 759 707Z"
        : "M894 784L1084 761 1103 815 900 840Z";
  const outline =
    kind === "recipient"
      ? "M727 343L736 336L1247 303L1253 403L740 440L731 435Z"
      : kind === "message"
        ? "M731 504L800 513L891 515L960 511L1043 509L1144 503L1231 495L1271 485L1277 535L1294 628L1303 682L1298 708L1237 703L738 733L726 729L731 630Z"
        : "M850 777L860 772L1117 739L1131 821L859 853Z";
  return (
    <svg
      className={`paper-frame ${kind}`}
      viewBox={box}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <CutoutFilter id={id} />
        <clipPath id={id + "clip"}>
          <path d={outline} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}clip)`}>
        <image href={source} width="1448" height="1086" filter={`url(#${id})`} />
        <path d={blank} fill="#f7f1e3" />
      </g>
    </svg>
  );
}
