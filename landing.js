/* =======================================================================
   LANDING PAGE — ABRAÃO J MIGUEL ADVOCACIA DO AGRO
   Scripts: reveal ao rolar, máscara de telefone, envio do formulário
   para o WhatsApp e eventos para o dataLayer (GTM / Pixel).
   Carregado no fim do <body> do index.html.
======================================================================== */

// ------------------------------------------------------------
// CONFIGURAÇÃO — número do WhatsApp que recebe os leads
// (formato internacional, só dígitos)
// ------------------------------------------------------------
var NUMERO_WHATSAPP = '5543991041313';

// ------------------------------------------------------------
// 1. Reveal ao rolar a página
// ------------------------------------------------------------
(function () {
    var itens = document.querySelectorAll('.revelar');
    if (!('IntersectionObserver' in window)) {
        itens.forEach(function (el) { el.classList.add('visivel'); });
        return;
    }
    var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('visivel');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    itens.forEach(function (el) { obs.observe(el); });
})();

// ------------------------------------------------------------
// 2. Máscara do telefone: (00) 00000-0000
// ------------------------------------------------------------
var campoTel = document.getElementById('tel');
campoTel.addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) {
        this.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length > 10 ? 7 : 6) + '-' + d.slice(d.length > 10 ? 7 : 6);
    } else if (d.length > 2) {
        this.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    } else if (d.length > 0) {
        this.value = '(' + d;
    }
});

// ------------------------------------------------------------
// 3. Envio do formulário → abre o WhatsApp com a mensagem pronta
//    + evento para o GTM / Pixel (dataLayer)
// ------------------------------------------------------------
document.getElementById('formularioContato').addEventListener('submit', function (e) {
    e.preventDefault();

    var nome = document.getElementById('nome').value.trim();
    var tel = campoTel.value.trim();
    var tema = document.getElementById('tema').value;
    var caso = document.getElementById('msg').value.trim();

    if (!nome || tel.replace(/\D/g, '').length < 10 || !tema) {
        alert('Por favor, preencha nome, WhatsApp (com DDD) e o assunto principal.');
        return;
    }

    var texto = 'Olá! Meu nome é ' + nome + '.\n' +
        'Assunto: ' + tema + '.\n' +
        (caso ? 'Meu caso: ' + caso + '\n' : '') +
        'Meu WhatsApp: ' + tel + '\n' +
        'Gostaria de agendar uma reunião estratégica.';

    // Evento de conversão (configure o gatilho "lead_formulario" no GTM)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_formulario', assunto: tema });

    // Meta Pixel: conversão de Lead
    if (window.fbq) { fbq('track', 'Lead', { content_name: tema }); }

    window.open('https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
});

// ------------------------------------------------------------
// 4. Eventos de clique nos CTAs (data-evento) para o dataLayer
// ------------------------------------------------------------
document.querySelectorAll('[data-evento]').forEach(function (el) {
    el.addEventListener('click', function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'clique_cta', local: el.getAttribute('data-evento') });

        // Meta Pixel: clique no WhatsApp conta como Contato
        if (window.fbq && el.href && el.href.indexOf('wa.me') !== -1) { fbq('track', 'Contact'); }
    });
});
