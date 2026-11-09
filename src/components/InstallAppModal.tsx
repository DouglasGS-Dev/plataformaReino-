import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Download, Share, PlusSquare, 
  CheckCircle2, ExternalLink, Globe, Sparkles, X, Copy, Check
} from 'lucide-react';
import { BaseModal } from './BaseModal';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from 'sonner';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    toast.success('Link do aplicativo copiado!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      toast.success('Aplicativo instalado com sucesso!');
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Instalar Aplicativo"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pwa'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone size={16} />
            <span>Instalar no Celular</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'apk'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download size={16} />
            <span>Gerar APK (Android)</span>
          </button>
        </div>

        {/* TAB 1: PWA Direct Install (Android & iOS) */}
        {activeTab === 'pwa' && (
          <div className="space-y-5">
            {isInstalled ? (
              <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Aplicativo Já Instalado</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Você já está executando o REINO em modo aplicativo no seu dispositivo.
                </p>
              </div>
            ) : (
              <>
                {/* Android / Desktop Install Prompt button if available */}
                {isInstallable && (
                  <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                        <Download size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">Instalação Direta Disponível</h5>
                        <p className="text-xs text-slate-500">Seu navegador suporta a instalação em 1 clique.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full py-3 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/25"
                    >
                      <Download size={16} />
                      Instalar Agora no Meu Aparelho
                    </button>
                  </div>
                )}

                {/* iOS Instructions */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      iPhone & iPad (iOS)
                    </span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2.5">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <span>Abra o link do app no navegador <strong>Safari</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        Toque no botão <strong>Compartilhar</strong> <Share size={14} className="inline text-primary" /> na barra inferior do Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare size={14} className="inline text-primary" />.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Android Chrome Instructions */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Android (Chrome / Samsung Internet)
                    </span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2.5">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <span>Abra o link no <strong>Google Chrome</strong> no seu celular.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <span>Toque no menu de <strong>3 pontinhos (⋮)</strong> no canto superior direito.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <span>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</span>
                    </li>
                  </ol>
                </div>
              </>
            )}

            {/* Share link button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedLink ? 'Link Copiado para a Área de Transferência!' : 'Copiar Link para Enviar no WhatsApp'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Generate APK via PWABuilder / Bubblewrap */}
        {activeTab === 'apk' && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 space-y-2">
              <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Como gerar o arquivo .APK em 2 minutos:
              </h5>
              <p className="text-slate-600 leading-relaxed">
                Como o REINO já é um PWA completo (com manifesto e suporte offline), você pode usar o <strong>PWABuilder</strong> (ferramenta oficial da Microsoft e Google) para empacotá-lo em um APK instalável ou pacote para a Google Play Store.
              </p>
            </div>

            <ol className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong>Copie o link público do seu app:</strong>
                  <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] select-all break-all text-slate-700">
                    {window.location.origin}
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong>Acesse o PWABuilder:</strong>
                  <p className="text-slate-500 mt-0.5">Vá para <span className="font-mono text-primary">pwabuilder.com</span> e cole o link acima.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong>Baixe o APK para testes:</strong>
                  <p className="text-slate-500 mt-0.5">Clique em <strong>"Package for Stores" → "Android"</strong> e selecione a opção de baixar o APK direto para instalar no celular ou o pacote AAB para a Google Play.</p>
                </div>
              </li>
            </ol>

            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Abrir PWABuilder.com</span>
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
