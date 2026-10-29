
// ===== RELÓGIO DE TAMBORES 3D =====
const relogio = document.getElementById("relogio");
const aparelho = document.getElementById("aparelho");
const tambores = [];
const pontos = [];
const reflexos = [];

function montar() {
    // espessura do corpo: fatias em profundidade
    const corpo = document.querySelector(".corpo");
    for (let k = 1; k <= 9; k++) {
        const fatia = document.createElement("i");
        fatia.style.transform = `translateZ(${-k * 3}px)`;
        fatia.style.background = `color-mix(in srgb, var(--lado) ${100 - k * 5}%, black)`;
        corpo.appendChild(fatia);
    }
    // 3 pares de tambores (HH MM SS) separados por lâmpadas
    for (let g = 0; g < 3; g++) {
        if (g > 0) {
            const p = document.createElement("span");
            p.className = "pontos";
            p.innerHTML = "<b></b><b></b>";
            pontos.push(...p.children);
            relogio.appendChild(p);
        }
        const par = document.createElement("div");
        par.className = "par";
        for (let d = 0; d < 2; d++) {
            const janela = document.createElement("div");
            janela.className = "janela";
            const tambor = document.createElement("div");
            tambor.className = "tambor" + (g * 2 + d === 5 ? " fluido" : "");
            for (let i = 0; i < 10; i++) {
                const face = document.createElement("span");
                face.className = "face";
                face.style.setProperty("--i", i);
                face.textContent = i;
                tambor.appendChild(face);
            }
            janela.appendChild(tambor);
            const reflexo = document.createElement("i");
            reflexo.className = "reflexo";
            janela.appendChild(reflexo);
            reflexos.push(reflexo);
            par.appendChild(janela);
            tambores.push({ el: tambor, ultimo: null, voltas: 0 });
        }
        relogio.appendChild(par);
    }
}
montar();

const dataEl = document.getElementById("data");
let tac = false;

function atualizarRelogio() {
    const agora = new Date();

    const horas = String(agora.getHours()).padStart(2, "0");
    const minutos = String(agora.getMinutes()).padStart(2, "0");
    const segundos = String(agora.getSeconds()).padStart(2, "0");
    const texto = horas + minutos + segundos;

    [...texto].forEach((c, i) => {
        const t = tambores[i];
        const n = Number(c);
        // sempre rola para frente, mesmo de 9 para 0
        t.voltas += t.ultimo === null ? n : (n - t.ultimo + 10) % 10;
        t.ultimo = n;
        t.el.style.setProperty("--a", t.voltas * 36 + "deg");
    });

    relogio.setAttribute("aria-label", `${horas}:${minutos}:${segundos}`);
    pontos.forEach(b => b.animate(
        [{ opacity: 1, transform: "scale(1.15)" }, { opacity: 0.7, transform: "scale(1)" }],
        { duration: 900, easing: "ease-out" }
    ));

    const dia = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const pct = Math.floor((agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds()) / 864);
    dataEl.textContent = `${dia} · ${pct}% do dia`;

    tic();
}

// ===== SOM DE RELÓGIO (opcional) =====
const botaoSom = document.getElementById("som");
let audio = null, somLigado = false;

botaoSom.addEventListener("click", function () {
    somLigado = !somLigado;
    if (somLigado && !audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    botaoSom.textContent = somLigado ? "🔊 Som" : "🔇 Som";
});

function tic() {
    if (!somLigado || !audio) return;
    tac = !tac;
    const n = Math.floor(audio.sampleRate * 0.035);
    const buf = audio.createBuffer(1, n, audio.sampleRate);
    const dados = buf.getChannelData(0);
    for (let i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const fonte = audio.createBufferSource();
    const filtro = audio.createBiquadFilter();
    const ganho = audio.createGain();
    fonte.buffer = buf;
    filtro.type = "bandpass";
    filtro.frequency.value = tac ? 1500 : 1000;
    ganho.gain.value = 0.6;
    fonte.connect(filtro).connect(ganho).connect(audio.destination);
    fonte.start();
}

// ===== INCLINAÇÃO 3D: mouse, dedo ou giroscópio do celular =====
let alvoX = 0, alvoY = 0, atualX = 0, atualY = 0;
const limitar = v => Math.max(-1, Math.min(1, v));
function mirar(px, py) { alvoY = px * 20; alvoX = -py * 14; }

window.addEventListener("pointermove", e => mirar(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1));
window.addEventListener("pointerup", () => mirar(0, 0));
document.documentElement.addEventListener("pointerleave", () => mirar(0, 0));
window.addEventListener("deviceorientation", e => {
    if (e.gamma == null) return;
    mirar(limitar(e.gamma / 35), limitar((e.beta - 50) / 35));
});
window.addEventListener("click", function pedir() { // iPhone exige permissão para o giroscópio
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().catch(() => {});
    }
}, { once: true });

const poeira = document.querySelector(".poeira");
function animar() {
    const dx = alvoX - atualX, dy = alvoY - atualY;
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        atualX += dx * 0.08;
        atualY += dy * 0.08;
        aparelho.style.transform = `rotateX(${atualX.toFixed(2)}deg) rotateY(${atualY.toFixed(2)}deg)`;
        reflexos.forEach(r => { r.style.transform = `translateX(${(atualY * 0.73).toFixed(2)}%)`; });
        poeira.style.setProperty("--tx", (-atualY).toFixed(2));
        poeira.style.setProperty("--ty", atualX.toFixed(2));
    }
    requestAnimationFrame(animar);
}
animar();

// poeira de luz flutuando em profundidades diferentes
for (let i = 0; i < 22; i++) {
    const p = document.createElement("i");
    const z = Math.random();
    p.style.cssText = `--x:${Math.random() * 100}%;--s:${(1 + z * 4).toFixed(1)}px;--o:${(0.25 + z * 0.5).toFixed(2)};` +
        `--b:${((1 - z) * 1.5).toFixed(1)}px;--z:${(z * 40 - 5).toFixed(0)};--d:${(25 + Math.random() * 30).toFixed(0)}s;--t:-${(Math.random() * 50).toFixed(0)}s`;
    poeira.appendChild(p);
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// ===== VERIFICAÇÃO DE IDADE =====
const botao = document.getElementById("verificar");
const resultado = document.getElementById("resultado");

botao.addEventListener("click", function () {
    let idade = Number(document.getElementById("idade").value);

    if (idade >= 18) {
        resultado.textContent = "Acesso liberado";
    } else {
        resultado.textContent = " Acesso negado,idade insuficiente";
    }
});

// ===== TEMA CLARO / ESCURO =====
const botaoTema = document.getElementById("tema");
const raiz = document.documentElement;

function alternarTema() {
    document.body.classList.toggle("tema-escuro");

    if (document.body.classList.contains("tema-escuro")) {
        botaoTema.textContent = "☀️ Modo Claro";
    } else {
        botaoTema.textContent = "🌙 Modo Escuro";
    }
}

// começa no tema certo para o horário real de quem abriu
const horaAtual = new Date().getHours();
if (horaAtual < 6 || horaAtual >= 18) alternarTema();

// cortina: cobre a tela, troca o tema escondido por trás dela, e depois revela
const cortina = document.createElement("div");
cortina.className = "cortina";
cortina.innerHTML = "<i></i>";
document.body.appendChild(cortina);

// salto no hiperespaço: túnel de raios + clarão (só transform e opacity, então é leve)
const salto = document.createElement("div");
salto.className = "salto";
salto.innerHTML = '<div class="raios r1"></div><div class="raios r2"></div><div class="miolo"></div><div class="clarao"></div>';
document.body.appendChild(salto);
const [r1, r2, miolo, clarao] = salto.children;

async function saltoHiperespaco() {
    const f = { fill: "forwards" };
    salto.classList.add("ativa");

    // entrada: a tela escurece e o túnel gira vindo do fundo
    salto.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out", ...f });
    r1.animate([{ transform: "scale(.15) rotate(0deg)" }, { transform: "scale(1.3) rotate(140deg)" }], { duration: 750, easing: "cubic-bezier(.5, 0, 1, .6)", ...f });
    r2.animate([{ transform: "scale(.15) rotate(0deg)" }, { transform: "scale(1.3) rotate(-200deg)" }], { duration: 750, easing: "cubic-bezier(.5, 0, 1, .6)", ...f });
    miolo.animate([{ transform: "scale(.2)", opacity: .4 }, { transform: "scale(1.6)", opacity: 1 }], { duration: 750, ...f });
    await esperar(700);

    // clarão: cobre tudo e o tema troca escondido
    await clarao.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, ...f }).finished;
    alternarTema();
    await doisQuadros();
    await esperar(150);

    // saída: a nave atravessa o túnel e o modo escuro aparece
    clarao.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, ...f });
    r1.animate([{ transform: "scale(1.3) rotate(140deg)" }, { transform: "scale(5) rotate(300deg)" }], { duration: 700, easing: "cubic-bezier(.3, 0, .2, 1)", ...f });
    r2.animate([{ transform: "scale(1.3) rotate(-200deg)" }, { transform: "scale(5) rotate(-380deg)" }], { duration: 700, easing: "cubic-bezier(.3, 0, .2, 1)", ...f });
    miolo.animate([{ transform: "scale(1.6)", opacity: 1 }, { transform: "scale(6)", opacity: 0 }], { duration: 700, ...f });
    await salto.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: "ease-in", ...f }).finished;

    salto.getAnimations({ subtree: true }).forEach(an => an.cancel());
    salto.classList.remove("ativa");
}

let trocando = false;
const esperar = ms => new Promise(r => setTimeout(r, ms));
const doisQuadros = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const suave = "cubic-bezier(.65, 0, .35, 1)";

botaoTema.addEventListener("click", async () => {

    if (trocando) return;

    trocando = true;

    const indoEscuro =
    !document.body.classList.contains("tema-escuro");

    if (indoEscuro) {

        await saltoHiperespaco();

    } else {

        cortina.className =
        "cortina ativa para-claro";

        await cortina.animate(
        [
            { transform: "translateY(115vh)" },
            { transform: "translateY(0)" }
        ],
        {
            duration: 700,
            easing: "ease-in-out",
            fill: "forwards"
        }).finished;

        alternarTema();

        await new Promise(r => setTimeout(r, 200));

        await cortina.animate(
        [
            { transform: "translateY(0)" },
            { transform: "translateY(-115vh)" }
        ],
        {
            duration: 700,
            easing: "ease-in-out",
            fill: "forwards"
        }).finished;

        cortina.className = "cortina";
    }

    trocando = false;
});