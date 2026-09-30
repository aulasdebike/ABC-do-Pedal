'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Shield,
  ExternalLink,
  ChevronRight,
  Info,
  Navigation,
  HelpCircle,
  Award,
  ArrowRight,
  MessageCircle,
  Phone,
  LogOut,
  Users,
  Search,
  Lock,
  FileCheck,
  Pencil,
  X,
  Save,
  CheckCircle2,
  Target,
  Upload,
  Eye,
  FileText,
  Maximize2,
  Plus,
  Camera,
  Image as ImageIcon,
  FileUp,
  Menu,
  ChevronDown,
  LayoutDashboard,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { CURRENT_PRODUCT } from '@/lib/products';
import { getBookingsFromFirestore, subscribeToBookings } from '@/lib/firebase';
import {
  BookingRecord,
  StudentData,
  getStoredBookings,
  saveStoredBookings,
  getStoredCurrentBookingId,
  formatDateBrazilian,
  getWeekdayName,
  isSlotExpired,
  isSlotMatchingStudentLocation,
  generateWhatsAppNotificationUrl,
  TimeSlot,
  getStoredSlots,
  saveStoredSlots,
  normalizeWhatsApp,
  findBookingsByWhatsApp,
  getStoredStudentWhatsApp,
  saveStoredStudentWhatsApp,
  submitBookingVoucher,
  compressReceiptImage,
  canStudentAlterBooking,
  getBookingVoucherUrl,
  SkillItem,
  DEFAULT_SKILLS,
  getStoredSkills,
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
  ABCDE_STAGES,
  ABCDESkillStatus,
  getStudentSkillStatus,
  getStudentHighlights,
  getABCDECompletionStats,
  checkAndProcessExpired24hRejections,
  isBookingAwaitingInstructorSchedule
} from '@/lib/booking-store';
import { ConquestCertificateModal } from './ConquestCertificateModal';

interface StudentPortalProps {
  initialBookingId?: string | null;
  onBackToBooking?: () => void;
}

export type StudentNavSection =
  | 'resumo'
  | 'proxima-aula'
  | 'minha-evolucao'
  | 'certificado'
  | 'comprovantes'
  | 'contratacao'
  | 'ajuda';

export function StudentPortal({ initialBookingId, onBackToBooking }: StudentPortalProps) {
  const [allBookings, setAllBookings] = useState<BookingRecord[]>(() => {
    if (typeof window !== 'undefined') {
      return getStoredBookings();
    }
    return [];
  });

  // WhatsApp Authentication state - The registered WhatsApp is the sole access credential
  const [loggedWhatsApp, setLoggedWhatsApp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = getStoredStudentWhatsApp();
      if (stored) {
        const bookings = getStoredBookings();
        const matches = findBookingsByWhatsApp(stored, bookings);
        if (matches.length > 0) {
          return stored;
        } else {
          saveStoredStudentWhatsApp(null);
        }
      }

      // If arrived with initialBookingId from an immediate booking completion
      if (initialBookingId) {
        const bookings = getStoredBookings();
        const found = bookings.find((b) => b.id === initialBookingId);
        if (found) {
          const wa = found.student.guardian?.whatsapp || found.student.whatsapp;
          if (wa) {
            saveStoredStudentWhatsApp(wa);
            return wa;
          }
        }
      }
    }
    return '';
  });

  const [inputWhatsApp, setInputWhatsApp] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Sync with Firestore database on mount to make sure all registered students are available
  useEffect(() => {
    let isMounted = true;
    async function syncDatabase() {
      try {
        const firestoreBookings = await getBookingsFromFirestore();
        if (isMounted && firestoreBookings && firestoreBookings.length > 0) {
          const local = getStoredBookings();
          const map = new Map<string, BookingRecord>();
          local.forEach((b) => map.set(b.id, b));
          firestoreBookings.forEach((b) => {
            const current = map.get(b.id);
            if (!current) {
              map.set(b.id, b);
            } else {
              const isBConfirmed =
                b.status === 'agendamento-confirmado' ||
                b.status === 'confirmado' ||
                b.status === 'pagamento-confirmado' ||
                Boolean(b.paymentConfirmedAt);
              const isCurConfirmed =
                current.status === 'agendamento-confirmado' ||
                current.status === 'confirmado' ||
                current.status === 'pagamento-confirmado' ||
                Boolean(current.paymentConfirmedAt);

              if (isBConfirmed && !isCurConfirmed) {
                map.set(b.id, b);
              } else if (!isBConfirmed && isCurConfirmed) {
                // Keep confirmed
              } else {
                map.set(b.id, b);
              }
            }
          });
          const merged = Array.from(map.values());
          saveStoredBookings(merged);
          setAllBookings(merged);

          // Verify if currently logged WhatsApp still exists in the database
          const stored = getStoredStudentWhatsApp();
          if (stored) {
            const matches = findBookingsByWhatsApp(stored, merged);
            if (matches.length === 0) {
              setLoggedWhatsApp('');
              saveStoredStudentWhatsApp(null);
            }
          }
        }
      } catch (e) {
        console.warn('Could not sync Firestore in StudentPortal:', e);
      }
    }
    syncDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for real-time Firestore updates
  useEffect(() => {
    const unsubscribe = subscribeToBookings((remoteBookings) => {
      if (remoteBookings && remoteBookings.length > 0) {
        const local = getStoredBookings();
        const map = new Map<string, BookingRecord>();
        local.forEach((b) => map.set(b.id, b));
        remoteBookings.forEach((b) => {
          const current = map.get(b.id);
          if (!current) {
            map.set(b.id, b);
          } else {
            const isBConfirmed =
              b.status === 'agendamento-confirmado' ||
              b.status === 'confirmado' ||
              b.status === 'pagamento-confirmado' ||
              Boolean(b.paymentConfirmedAt);
            const isCurConfirmed =
              current.status === 'agendamento-confirmado' ||
              current.status === 'confirmado' ||
              current.status === 'pagamento-confirmado' ||
              Boolean(current.paymentConfirmedAt);

            if (isBConfirmed && !isCurConfirmed) {
              map.set(b.id, b);
            } else if (!isBConfirmed && isCurConfirmed) {
              // Keep
            } else {
              map.set(b.id, b);
            }
          }
        });
        const merged = Array.from(map.values());
        saveStoredBookings(merged);
        setAllBookings(merged);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter bookings associated with the currently authenticated student WhatsApp
  const matchingBookings = loggedWhatsApp
    ? findBookingsByWhatsApp(loggedWhatsApp, allBookings)
    : [];

  // Selected Booking state
  const [selectedBookingId, setSelectedBookingId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const activeStored = getStoredCurrentBookingId();
      if (activeStored) return activeStored;
    }
    return initialBookingId || '';
  });

  // Current active booking
  const booking =
    matchingBookings.find((b) => b.id === selectedBookingId) ||
    matchingBookings[0] ||
    null;

  // Active section for navigation
  const [activeSection, setActiveSection] = useState<StudentNavSection>('resumo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Status flags
  const isAwaitingInstructor =
    booking?.status === 'aguardando-confirmacao-instrutor' ||
    booking?.status === 'comprovante-enviado';
  const isPaymentConfirmed =
    booking?.status === 'agendamento-confirmado' ||
    booking?.status === 'confirmado' ||
    booking?.status === 'pagamento-confirmado' ||
    Boolean(booking?.paymentConfirmedAt);
  const isRejected =
    booking?.status === 'comprovante-rejeitado' ||
    booking?.status === 'comprovante-reprovado';
  const isAwaitingNewPayment = booking?.status === 'aguardando-novo-pagamento';
  const isTemporary =
    booking?.status === 'reserva-temporaria' ||
    booking?.status === 'aguardando-pagamento';
  const isAwaitingSchedule = Boolean(
    booking && isBookingAwaitingInstructorSchedule(booking)
  );
  const isProgramCompleted = booking?.currentABCDE === 'E';

  // Real-time synchronization events
  useEffect(() => {
    checkAndProcessExpired24hRejections();
    const handleSyncEvent = () => {
      checkAndProcessExpired24hRejections();
      setAllBookings(getStoredBookings());
    };
    window.addEventListener('abc_booking_rejected', handleSyncEvent);
    window.addEventListener('abc_booking_updated', handleSyncEvent);
    return () => {
      window.removeEventListener('abc_booking_rejected', handleSyncEvent);
      window.removeEventListener('abc_booking_updated', handleSyncEvent);
    };
  }, []);

  // Modal para conferência em tamanho maior do comprovante
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<{
    url: string;
    fileName: string;
    title: string;
  } | null>(null);

  // Estados para envio/reenvio do comprovante de pagamento
  const [reuploadPreview, setReuploadPreview] = useState<string | null>(null);
  const [reuploadFileName, setReuploadFileName] = useState<string>('');
  const [isSubmittingReupload, setIsSubmittingReupload] = useState(false);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [reuploadSuccessMsg, setReuploadSuccessMsg] = useState<string | null>(null);

  const handleCancelReupload = () => {
    setReuploadPreview(null);
    setReuploadFileName('');
    setReuploadError(null);
  };

  const formatDateTimeDisplay = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  const handleReuploadFileChange = (file: File) => {
    setReuploadError(null);
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const nameLower = file.name.toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validExts.some((ext) => nameLower.endsWith(ext));

    if (!validMimes.includes(file.type) && !hasValidExt) {
      setReuploadError('Permitido apenas arquivos de imagem nos formatos JPG, JPEG, PNG ou WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setReuploadError('A imagem não pode ultrapassar 15MB. Envie um arquivo menor.');
      return;
    }

    compressReceiptImage(file)
      .then((dataUrl) => {
        setReuploadPreview(dataUrl);
        setReuploadFileName(file.name);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setReuploadPreview(dataUrl);
          setReuploadFileName(file.name);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleConfirmReupload = () => {
    if (!booking || !reuploadPreview) {
      setReuploadError('Selecione uma imagem do comprovante antes de enviar.');
      return;
    }

    setIsSubmittingReupload(true);
    setReuploadError(null);

    const updated = submitBookingVoucher(booking.id, {
      voucherUrl: reuploadPreview,
      voucherFileName: reuploadFileName || 'comprovante_pagamento.jpg'
    });

    if (updated) {
      const fresh = getStoredBookings();
      setAllBookings(fresh);
      setSelectedBookingId(updated.id);
      setReuploadPreview(null);
      setReuploadFileName('');
      setReuploadSuccessMsg('Novo comprovante enviado com sucesso e atualizado no sistema para análise do instrutor!');
      setTimeout(() => setReuploadSuccessMsg(null), 6000);
    }
    setIsSubmittingReupload(false);
  };

  const [prevInitialBookingId, setPrevInitialBookingId] = useState(initialBookingId);
  if (initialBookingId !== prevInitialBookingId) {
    setPrevInitialBookingId(initialBookingId);
    if (initialBookingId) {
      const found = allBookings.find((b) => b.id === initialBookingId);
      if (found) {
        const wa = found.student.guardian?.whatsapp || found.student.whatsapp;
        if (wa) {
          saveStoredStudentWhatsApp(wa);
          setLoggedWhatsApp(wa);
          setSelectedBookingId(found.id);
        }
      }
    }
  }

  const [showScheduleNewModal, setShowScheduleNewModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(() => {
    if (typeof window !== 'undefined') {
      return getStoredSlots().filter((s) => s.status === 'available' && !isSlotExpired(s.date, s.time));
    }
    return [];
  });
  const [selectedSlotForNew, setSelectedSlotForNew] = useState<TimeSlot | null>(null);
  const [cancellationAlert, setCancellationAlert] = useState<{
    canCancelFree: boolean;
    hoursLeft: number;
  } | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  // Cálculo das 20 habilidades do Método ABCDE e checagem de 100% de conclusão para o certificado
  const completionStats = booking ? getABCDECompletionStats(booking) : null;

  // Format phone number
  const formatPhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleLoginWithWhatsApp = async (e?: React.FormEvent, directNumber?: string) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const numberToTest = directNumber || inputWhatsApp;
    const cleanInput = normalizeWhatsApp(numberToTest);

    if (!cleanInput || cleanInput.length < 10) {
      setAuthError('Por favor, informe o WhatsApp completo com DDD (ex: (11) 95043-8948).');
      return;
    }

    setIsVerifying(true);
    try {
      let currentBookings = getStoredBookings();
      try {
        const firestoreBookings = await getBookingsFromFirestore();
        if (firestoreBookings && firestoreBookings.length > 0) {
          const map = new Map<string, BookingRecord>();
          currentBookings.forEach((b) => map.set(b.id, b));
          firestoreBookings.forEach((b) => map.set(b.id, b));
          currentBookings = Array.from(map.values());
          saveStoredBookings(currentBookings);
        }
      } catch (err) {
        console.warn('Fallback to local database store:', err);
      }

      setAllBookings(currentBookings);
      const matches = findBookingsByWhatsApp(cleanInput, currentBookings);

      if (matches.length === 0) {
        setAuthError(
          `Acesso negado: O WhatsApp informado (${numberToTest}) não consta no cadastro de alunos do sistema. O acesso à Área do Aluno é liberado exclusivamente para o WhatsApp vinculado a uma matrícula ou reserva ativa.`
        );
        setIsVerifying(false);
        return;
      }

      saveStoredStudentWhatsApp(numberToTest);
      setLoggedWhatsApp(numberToTest);

      const preferred =
        matches.find(
          (b) =>
            b.status === 'aguardando-confirmacao-instrutor' ||
            b.status === 'comprovante-enviado' ||
            b.status === 'agendamento-confirmado' ||
            b.status === 'confirmado' ||
            b.status === 'comprovante-rejeitado' ||
            b.status === 'comprovante-reprovado' ||
            b.status === 'aguardando-novo-pagamento'
        ) || matches[0];

      setSelectedBookingId(preferred.id);
      setAuthError(null);
    } catch (err) {
      console.error('Erro na consulta do banco de dados:', err);
      setAuthError('Falha temporária ao consultar o banco de dados. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    saveStoredStudentWhatsApp(null);
    setLoggedWhatsApp('');
    setSelectedBookingId('');
    setInputWhatsApp('');
    setAuthError(null);
  };

  // Check 24-hour cancellation rule
  const handleInitiateCancel = () => {
    if (!booking) return;

    const perm = canStudentAlterBooking(booking);
    if (!perm.allowed) {
      alert(perm.reason || 'Operação de cancelamento bloqueada.');
      return;
    }

    if (isBookingAwaitingInstructorSchedule(booking) || !booking.slot?.date || !booking.slot?.time) {
      alert('A aula ainda está aguardando a definição de data e horário pelo instrutor.');
      return;
    }

    const [year, month, day] = booking.slot.date.split('-').map(Number);
    const [hour, min] = booking.slot.time.split(':').map(Number);
    const slotDateTime = new Date(year, month - 1, day, hour, min);
    const now = new Date();

    const diffMs = slotDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    setCancellationAlert({
      canCancelFree: diffHours >= 24,
      hoursLeft: Math.round(diffHours)
    });
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = () => {
    if (!booking) return;

    const updated: BookingRecord = {
      ...booking,
      status: 'cancelado',
      cancellationReason: cancellationAlert?.canCancelFree
        ? 'Cancelado com mais de 24h de antecedência'
        : 'Cancelado com menos de 24h (sujeito a taxa de R$ 50 para remarcação)',
      cancellationFee: cancellationAlert?.canCancelFree ? 0 : 50.0
    };

    const all = getStoredBookings().map((b) => (b.id === updated.id ? updated : b));
    saveStoredBookings(all);
    setAllBookings(all);
    setShowCancelConfirmation(false);

    const slots = getStoredSlots().map((s) => {
      if (s.id === booking.slot?.id) {
        const freed = { ...s, status: 'available' as const };
        delete freed.bookedByStudentName;
        delete freed.bookingId;
        return freed;
      }
      return s;
    });
    saveStoredSlots(slots);
  };

  const handleScheduleNextSession = () => {
    if (!selectedSlotForNew || !booking) return;

    const perm = canStudentAlterBooking(booking);
    if (!perm.allowed) {
      alert(perm.reason || 'Operação de remarcação bloqueada.');
      return;
    }

    const updated: BookingRecord = {
      ...booking,
      slot: {
        id: selectedSlotForNew.id,
        date: selectedSlotForNew.date,
        time: selectedSlotForNew.time,
        durationMinutes: 50
      },
      status: 'confirmado'
    };

    const all = getStoredBookings().map((b) => (b.id === updated.id ? updated : b));
    saveStoredBookings(all);
    setAllBookings(all);

    const slots = getStoredSlots().map((s) => {
      if (s.id === selectedSlotForNew.id) {
        return {
          ...s,
          status: 'occupied' as const,
          bookedByStudentName: booking.student.fullName,
          bookingId: booking.id
        };
      }
      return s;
    });
    saveStoredSlots(slots);

    setSelectedSlotForNew(null);
    setShowScheduleNewModal(false);
  };

  // =========================================================
  // TELA DE AUTENTICAÇÃO POR WHATSAPP (Se não autenticado)
  // =========================================================
  if (!loggedWhatsApp || matchingBookings.length === 0 || !booking) {
    const recentStudents = allBookings
      .filter((b) => b.student?.whatsapp)
      .slice(-5)
      .reverse();

    return (
      <div className="max-w-xl mx-auto py-10 px-4 sm:px-6 animate-in fade-in duration-300">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-600/30">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Área do Aluno
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Informe o número do seu <strong>WhatsApp cadastrado</strong> para acessar suas aulas, acompanhar sua evolução e emitir certificados.
            </p>
          </div>

          <form onSubmit={handleLoginWithWhatsApp} className="space-y-4">
            <div>
              <label
                htmlFor="whatsapp-login-input"
                className="block text-xs font-mono font-bold text-slate-300 uppercase mb-2"
              >
                Número do seu WhatsApp (com DDD)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-pink-400 absolute left-3.5 top-3.5" />
                <input
                  id="whatsapp-login-input"
                  type="tel"
                  value={inputWhatsApp}
                  onChange={(e) => setInputWhatsApp(formatPhoneInput(e.target.value))}
                  placeholder="(11) 95043-8948"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs font-mono text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 hover:from-pink-500 hover:to-rose-500 text-white font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <span>Consultando cadastro...</span>
              ) : (
                <>
                  <span>Entrar na Minha Área</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalho rápido para alunos cadastrados caso teste em ambiente local */}
          {recentStudents.length > 0 && (
            <div className="pt-4 border-t border-slate-800 text-center space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block">
                Últimos alunos matriculados neste dispositivo:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {recentStudents.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const wa = b.student?.guardian?.whatsapp || b.student?.whatsapp;
                      if (wa) {
                        setInputWhatsApp(wa);
                        handleLoginWithWhatsApp(undefined, wa);
                      }
                    }}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-pink-400 border border-slate-800 transition-colors"
                  >
                    {b.student.fullName.split(' ')[0]} ({b.student.whatsapp})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Precisa de ajuda com seu acesso? Fale no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Definição das seções de navegação do Aluno
  const navItems: { id: StudentNavSection; label: string; icon: any }[] = [
    { id: 'resumo', label: 'Resumo', icon: LayoutDashboard },
    { id: 'proxima-aula', label: 'Próxima aula', icon: Calendar },
    { id: 'minha-evolucao', label: 'Minha evolução', icon: Target },
    { id: 'certificado', label: 'Certificado', icon: Award },
    { id: 'comprovantes', label: 'Comprovantes', icon: FileCheck },
    { id: 'contratacao', label: 'Dados da contratação', icon: FileText },
    { id: 'ajuda', label: 'Ajuda e contato', icon: QuestionIcon }
  ];

  // Helper de Local e Endereço
  const loc = booking.location;
  const rawCep = loc?.cep;
  const formattedCep = rawCep ? rawCep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';
  const isCustomCepLocation = loc?.isFixed === false || Boolean(rawCep && !loc?.isFixed);
  const assignedLoc = booking.assignedLocationName || loc?.locationName || booking.slot?.locationName;
  const meetingLocationTitle = isCustomCepLocation
    ? (assignedLoc || (formattedCep ? `Local no CEP ${formattedCep}` : 'Local sob demanda'))
    : (assignedLoc || CURRENT_PRODUCT.location.name);
  const addressLine = loc?.address
    ? `${loc.address}${loc.number ? `, nº ${loc.number}` : ''}${loc.city ? ` — ${loc.city}` : ''}${loc.state ? ` - ${loc.state}` : ''}`
    : (assignedLoc || CURRENT_PRODUCT.location.address);
  const mapsSearchQuery = [
    assignedLoc,
    loc?.address,
    loc?.number ? `nº ${loc.number}` : '',
    formattedCep ? `CEP ${formattedCep}` : '',
    loc?.city || booking.assignedLocationCity || 'São Paulo',
    loc?.state || 'SP'
  ].filter(Boolean).join(', ');
  const mapsUrl = loc?.mapsUrl || (
    mapsSearchQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsSearchQuery)}`
      : CURRENT_PRODUCT.location.mapsUrl
  );
  const meetingSuggestion = isCustomCepLocation
    ? `Ponto de encontro definido no mesmo endereço do CEP pesquisado (${formattedCep || 'informado pelo aluno'}). O instrutor e o aluno encontram-se pontualmente no local informado.`
    : (loc?.fixedNote || 'Ponto de encontro estabelecido conforme o local cadastrado para a aula.');

  // Informações de comprovante ativo
  const activeVoucherUrl = getBookingVoucherUrl(booking);
  const latestAttempt = booking.voucherAttempts && booking.voucherAttempts.length > 0
    ? booking.voucherAttempts[booking.voucherAttempts.length - 1]
    : null;
  const activeFileName = latestAttempt?.voucherFileName || booking.voucherFileName || 'comprovante_pagamento.jpg';
  const activeSentAt = latestAttempt?.voucherSentAt || booking.voucherSentAt;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in" id="student-portal-main">
      {/* Top Header do Aluno */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                {booking.student.fullName}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Área do Aluno
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">
              WhatsApp: {loggedWhatsApp} • Inscrição #{booking.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {matchingBookings.length > 1 && (
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-pink-500"
            >
              {matchingBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.student.fullName} ({b.slot?.date ? formatDateBrazilian(b.slot.date) : 'Aguardando data'})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sair ou trocar de WhatsApp"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Reupload Success Notification */}
      {reuploadSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reuploadSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setReuploadSuccessMsg(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Layout com Menu Lateral Desktop e Abas Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Desktop / Menu de Navegação */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Navegação Principal */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Navegação do Aluno
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-950/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </button>
              );
            })}
          </div>

          {/* Card Resumo do Status Atual */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Status Operacional
            </span>
            <span
              className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                isPaymentConfirmed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : isAwaitingInstructor
                  ? 'bg-amber-400 text-slate-950 border-yellow-300'
                  : isRejected
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                  : isAwaitingNewPayment
                  ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                  : 'bg-pink-950 text-pink-300 border-pink-500/40'
              }`}
            >
              {isPaymentConfirmed
                ? 'Agendamento Confirmado'
                : isAwaitingInstructor
                ? 'Comprovante em Análise'
                : isRejected
                ? 'Comprovante Reprovado'
                : isAwaitingNewPayment
                ? 'Prazo 24h Encerrado'
                : 'Reserva Temporária'}
            </span>
            <p className="text-[11px] text-slate-400 font-light leading-relaxed pt-1">
              Programa Aprender a Pedalar • Método ABCDE
            </p>
          </div>
        </aside>

        {/* Área de Conteúdo Principal */}
        <main className="lg:col-span-3 space-y-6">
          {/* Breadcrumb da Seção Atual */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pb-1">
            <span>Área do Aluno</span>
            <span>/</span>
            <span className="text-pink-400 font-bold capitalize">
              {navItems.find((n) => n.id === activeSection)?.label}
            </span>
          </div>

          {/* ========================================================= */}
          {/* 1. SEÇÃO: RESUMO */}
          {/* ========================================================= */}
          {activeSection === 'resumo' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-resumo">
              {/* Banner do Aluno e Status */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-pink-950/30 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider block">
                      Painel do Aluno
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {booking.student.fullName}
                    </h3>
                  </div>
                  <span
                    className={`self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase border ${
                      isPaymentConfirmed
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : isAwaitingInstructor
                        ? 'bg-amber-400 text-slate-950 border-yellow-300 font-black'
                        : isRejected
                        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                        : isAwaitingNewPayment
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-pink-950 text-pink-300 border-pink-500/40'
                    }`}
                  >
                    {isPaymentConfirmed
                      ? 'Agendamento Confirmado'
                      : isAwaitingInstructor
                      ? 'Comprovante em Análise'
                      : isRejected
                      ? 'Comprovante Reprovado'
                      : isAwaitingNewPayment
                      ? 'Aguardando Novo Pagamento'
                      : 'Reserva Temporária'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {isPaymentConfirmed
                    ? 'Sua aula está oficialmente confirmada e sua vaga garantida com o instrutor.'
                    : isAwaitingInstructor
                    ? 'Seu comprovante foi enviado e está em análise pelo instrutor. O horário permanece reservado.'
                    : isRejected
                    ? 'Seu comprovante foi reprovado. Favor reenviar um comprovante válido ou falar no WhatsApp.'
                    : 'Acompanhe as informações da sua aula, evolução no Método ABCDE e certificados.'}
                </p>
              </div>

              {/* Card Próxima Aula no Resumo */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-400" />
                    <h4 className="font-bold text-white text-base">Próxima Aula</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('proxima-aula')}
                    className="text-xs font-mono text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver detalhes completos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Data</span>
                    <strong className="text-white text-sm block mt-1">
                      {booking.slot?.date ? formatDateBrazilian(booking.slot.date) : 'Aguardando confirmação'}
                    </strong>
                    {booking.slot?.date && (
                      <span className="text-pink-400 text-[11px]">{getWeekdayName(booking.slot.date)}</span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Horário & Duração</span>
                    <strong className="text-white text-sm block mt-1">
                      {booking.slot?.time || 'Aguardando confirmação'}
                    </strong>
                    <span className="text-slate-400 text-[11px]">50 minutos de aula</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Local Confirmado</span>
                    <strong className="text-white text-xs block mt-1 truncate">
                      {meetingLocationTitle}
                    </strong>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 underline text-[11px] inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>Abrir no Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Ações Atualmente Disponíveis (Remarcar ou Cancelar) */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {isPaymentConfirmed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = getStoredSlots().filter((s) => s.status === 'available' && !isSlotExpired(s.date, s.time));
                          setAvailableSlots(fresh);
                          setShowScheduleNewModal(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Remarcar Aula</span>
                      </button>

                      {booking.status !== 'cancelado' && (
                        <button
                          type="button"
                          onClick={handleInitiateCancel}
                          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-rose-400 text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          Cancelar Agendamento
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Remarcações e cancelamentos ficam liberados automaticamente após a confirmação do pagamento pelo instrutor.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Atalhos Rápidos para Outras Seções */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveSection('minha-evolucao')}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition-transform">
                    <Target className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-white text-sm">Minha Evolução</h5>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Etapa Atual: <strong className="text-pink-400">{booking.currentABCDE || 'A'}</strong>
                  </p>
                  <span className="text-[11px] text-pink-400 font-mono mt-2 inline-flex items-center gap-1">
                    Ver habilidades <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveSection('certificado')}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <Award className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-white text-sm">Certificado</h5>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {completionStats?.isFullyCompleted ? 'Disponível para emissão' : 'Em andamento'}
                  </p>
                  <span className="text-[11px] text-amber-400 font-mono mt-2 inline-flex items-center gap-1">
                    Acessar certificado <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveSection('comprovantes')}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-white text-sm">Comprovantes</h5>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    R$ {(booking.price || 499).toFixed(2).replace('.', ',')} (PIX)
                  </p>
                  <span className="text-[11px] text-emerald-400 font-mono mt-2 inline-flex items-center gap-1">
                    Ver comprovante <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SEÇÃO: PRÓXIMA AULA */}
          {/* ========================================================= */}
          {activeSection === 'proxima-aula' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-proxima-aula">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                      Agendamento Oficial
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Informações da Próxima Aula
                    </h3>
                  </div>

                  <span
                    className={`self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase border ${
                      isPaymentConfirmed
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : isAwaitingInstructor
                        ? 'bg-amber-400 text-slate-950 border-yellow-300 font-black'
                        : isRejected
                        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                        : 'bg-pink-950 text-pink-300 border-pink-500/40'
                    }`}
                  >
                    {isPaymentConfirmed
                      ? 'Aula Confirmada'
                      : isAwaitingInstructor
                      ? 'Aguardando Confirmação'
                      : isRejected
                      ? 'Comprovante Reprovado'
                      : 'Reserva Temporária'}
                  </span>
                </div>

                {/* Grid de Horário e Local */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      <span>Data e Horário</span>
                    </span>
                    <p className="text-base font-bold text-white">
                      {booking.slot?.date ? formatDateBrazilian(booking.slot.date) : 'AGUARDANDO CONFIRMAÇÃO'}
                      {booking.slot?.time ? ` às ${booking.slot.time}` : ''}
                    </p>
                    <p className="text-slate-400 text-[11px]">Duração da aula: 50 minutos</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-400" />
                      <span>Local e Endereço</span>
                    </span>
                    <p className="text-sm font-bold text-white leading-snug">
                      {meetingLocationTitle}
                    </p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {addressLine}
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 underline text-xs inline-flex items-center gap-1 font-bold pt-1"
                    >
                      <span>Abrir no Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Ponto de Encontro e Orientações */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-pink-400" />
                    <span>Ponto de Encontro e Orientações Importantes</span>
                  </h4>
                  <p className="text-slate-300 font-light leading-relaxed">
                    {meetingSuggestion}
                  </p>
                  <ul className="space-y-1.5 text-slate-400 font-light list-disc pl-5 leading-relaxed text-[11px]">
                    <li>Chegue com 10 minutos de antecedência.</li>
                    <li>Utilize calçado fechado (tênis) e roupas confortáveis.</li>
                    <li>Bicicleta calibrada e capacete higienizado são fornecidos pela ABC do Pedal.</li>
                    <li>Traga garrafinha de água e protetor solar.</li>
                    <li>Remarcações gratuitas devem ser solicitadas com no mínimo 24h de antecedência.</li>
                  </ul>
                </div>

                {/* Ações: Remarcação, Cancelamento e Contato */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {isPaymentConfirmed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = getStoredSlots().filter((s) => s.status === 'available' && !isSlotExpired(s.date, s.time));
                          setAvailableSlots(fresh);
                          setShowScheduleNewModal(true);
                        }}
                        className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Remarcar Horário</span>
                      </button>

                      {booking.status !== 'cancelado' && (
                        <button
                          type="button"
                          onClick={handleInitiateCancel}
                          className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-rose-400 text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          Cancelar Agendamento
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2 w-full">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Remarcação e cancelamento estão bloqueados no momento aguardando a aprovação do comprovante pelo instrutor.
                      </span>
                    </div>
                  )}

                  <a
                    href={`https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Olá instrutor, sou ${booking.student.fullName} (Inscrição #${booking.id.slice(0, 8)}). Gostaria de tirar dúvidas sobre minha aula.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow cursor-pointer ml-auto"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar com o Instrutor</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. SEÇÃO: MINHA EVOLUÇÃO */}
          {/* ========================================================= */}
          {activeSection === 'minha-evolucao' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-evolucao">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                      Desenvolvimento Pedagógico
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Método ABCDE
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      Etapa Atual: <strong className="text-pink-400 font-bold">{booking.currentABCDE}</strong>
                    </span>
                    {completionStats && (
                      <span className="text-xs font-mono bg-pink-950/80 text-pink-300 border border-pink-500/40 px-3 py-1.5 rounded-lg font-bold">
                        {completionStats.conqueredCount}/{completionStats.totalSkills} Habilidades
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso Geral */}
                {completionStats && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Progresso Geral de Domínio:</span>
                      <span className="text-pink-400 font-bold">{completionStats.percent}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${completionStats.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Resumo Visual: Última Conquista & Próximo Desafio */}
                {(() => {
                  const highlights = getStudentHighlights(booking);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">
                            Última Conquista
                          </span>
                          <p className="text-xs font-semibold text-white leading-snug">
                            {highlights.latestAchievement}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-pink-500/30 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-pink-400 block">
                            Próximo Desafio
                          </span>
                          <p className="text-xs font-semibold text-white leading-snug">
                            {highlights.nextChallenge}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* As 5 Etapas do Método ABCDE com Habilidades */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-bold text-white">
                    Habilidades Observáveis por Etapa Pedagógica
                  </h4>

                  <div className="space-y-3">
                    {ABCDE_STAGES.map((stage) => {
                      const isCurrent = stage.letter === booking.currentABCDE;
                      return (
                        <div
                          key={stage.letter}
                          className={`p-4 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-slate-950 border-pink-500/60 shadow-md shadow-pink-950/20'
                              : 'bg-slate-950/40 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                                  isCurrent
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}
                              >
                                {stage.letter}
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-xs sm:text-sm">
                                  {stage.letter} — {stage.title}
                                </h5>
                                <p className="text-[11px] text-slate-400">{stage.objective}</p>
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-bold">
                                Etapa Atual
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {stage.skills.map((sk) => {
                              const status = getStudentSkillStatus(booking, sk.id);
                              const isDone = status === 'Consolidado' || status === 'Autônomo';
                              const isInDev = status === 'Em desenvolvimento';

                              return (
                                <div
                                  key={sk.id}
                                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="font-semibold text-white text-[11px] truncate">
                                      {sk.code}. {sk.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">{sk.description}</p>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 border ${
                                      isDone
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                        : isInDev
                                        ? 'bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse'
                                        : 'bg-slate-950 text-slate-500 border-slate-800'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. SEÇÃO: CERTIFICADO */}
          {/* ========================================================= */}
          {activeSection === 'certificado' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-certificado">
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-950">
                  <Award className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Certificação Oficial do Aluno
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    Certificado de Conquista • Método ABCDE
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                    Documento comemorativo e oficial com QR Code de autenticidade, emitido com a consolidação das 20 habilidades motoras.
                  </p>
                </div>

                {completionStats?.isFullyCompleted ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-amber-500/60 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Certificado Conquistado (100% Concluído)</span>
                    </div>

                    <p className="text-xs text-amber-200">
                      Parabéns, {booking.student.fullName}! Seu certificado oficial está liberado para visualização, download e compartilhamento.
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsCertificateModalOpen(true)}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950 cursor-pointer flex items-center justify-center gap-2 mx-auto"
                    >
                      <Award className="w-4 h-4 text-slate-950" />
                      <span>Visualizar / Abrir Certificado</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-mono text-slate-400 block">
                      Status Atual: <strong className="text-amber-400 font-bold">Em Desenvolvimento</strong>
                    </span>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      Você completou <strong>{completionStats?.conqueredCount || 0} de {completionStats?.totalSkills || 20} habilidades</strong> do Método ABCDE. O certificado oficial será emitido assim que todas as habilidades forem concluídas nas aulas práticas.
                    </p>
                    <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-pink-600 transition-all duration-500"
                        style={{ width: `${completionStats?.percent || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. SEÇÃO: COMPROVANTES */}
          {/* ========================================================= */}
          {activeSection === 'comprovantes' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-comprovantes">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                      Financeiro e Validação
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Comprovante de Pagamento
                    </h3>
                  </div>

                  <span
                    className={`self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase border ${
                      isPaymentConfirmed
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : isAwaitingInstructor
                        ? 'bg-amber-400 text-slate-950 border-yellow-300 font-black'
                        : isRejected
                        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                        : 'bg-amber-950 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isPaymentConfirmed
                      ? 'Pagamento Aprovado'
                      : isAwaitingInstructor
                      ? 'Comprovante em Análise'
                      : isRejected
                      ? 'Comprovante Reprovado'
                      : 'Aguardando Pagamento'}
                  </span>
                </div>

                {/* Dados da Transação */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Valor Investido</span>
                    <strong className="text-emerald-400 text-sm block mt-1">
                      R$ {(booking.price || 499).toFixed(2).replace('.', ',')}
                    </strong>
                    <span className="text-slate-400 text-[11px]">Forma: Transferência PIX</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Data de Envio</span>
                    <strong className="text-white text-xs block mt-1">
                      {formatDateTimeDisplay(activeSentAt) || 'Recente'}
                    </strong>
                    <span className="text-slate-400 text-[11px] truncate block">
                      Arquivo: {activeFileName}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Responsável Validação</span>
                    <strong className="text-white text-xs block mt-1">
                      {booking.approvedBy || booking.rejectedBy || 'Instrutor ABC do Pedal'}
                    </strong>
                    <span className="text-slate-400 text-[11px]">Validação manual oficial</span>
                  </div>
                </div>

                {/* Visualização da Imagem Anexada */}
                {activeVoucherUrl ? (
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-300 block">
                      Imagem do Comprovante Registrado
                    </span>
                    <div
                      onClick={() =>
                        setSelectedVoucherForView({
                          url: activeVoucherUrl,
                          fileName: activeFileName,
                          title: 'Comprovante de Pagamento'
                        })
                      }
                      className="p-3 rounded-2xl bg-black/80 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer text-center max-w-sm"
                    >
                      <img
                        src={activeVoucherUrl}
                        alt="Comprovante de pagamento"
                        className="max-h-56 mx-auto rounded-lg object-contain"
                      />
                      <span className="text-[11px] font-mono text-pink-400 inline-flex items-center gap-1 mt-2">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Clique para ampliar imagem</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs text-slate-500">
                    Nenhum comprovante anexado no momento.
                  </div>
                )}

                {/* Área para Envio ou Substituição quando Reprovado ou Pendente */}
                {(isRejected || isAwaitingInstructor) && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-pink-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-pink-400" />
                        <span>Substituir ou Enviar Novo Comprovante</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">JPG, PNG ou WEBP até 15MB</span>
                    </div>

                    <input
                      type="file"
                      id="input-comprovante-secao"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReuploadFileChange(file);
                      }}
                      className="hidden"
                    />

                    {reuploadPreview ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={reuploadPreview}
                            alt="Pré-visualização"
                            className="max-h-40 rounded-lg border border-slate-700 mx-auto"
                          />
                          <button
                            type="button"
                            onClick={handleCancelReupload}
                            className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-mono text-emerald-400">
                          Selecionado: {reuploadFileName}
                        </p>
                        <button
                          type="button"
                          onClick={handleConfirmReupload}
                          disabled={isSubmittingReupload}
                          className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Envio do Comprovante</span>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="input-comprovante-secao"
                        className="cursor-pointer block p-4 rounded-xl border border-dashed border-slate-800 hover:border-pink-500/50 text-center transition-colors space-y-1"
                      >
                        <Upload className="w-6 h-6 text-pink-400 mx-auto" />
                        <span className="text-xs font-mono font-bold text-pink-300 block">
                          Clique para escolher nova imagem do comprovante
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          O arquivo substituirá o anterior e entrará imediatamente em análise.
                        </span>
                      </label>
                    )}

                    {reuploadError && (
                      <p className="text-xs font-mono text-rose-400 font-bold">{reuploadError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. SEÇÃO: DADOS DA CONTRATAÇÃO */}
          {/* ========================================================= */}
          {activeSection === 'contratacao' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-contratacao">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                      Registro Contratual Permanente
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Dados da Contratação
                    </h3>
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 text-[11px] font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Campo Não Editável</span>
                  </div>
                </div>

                {/* Grid com Cartões de Dados Organizados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Dados do Aluno */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      <span>Dados do Aluno</span>
                    </span>
                    <p className="text-sm font-bold text-white">{booking.student.fullName}</p>
                    {booking.student.cpf && <p className="text-slate-400">CPF: {booking.student.cpf}</p>}
                    {booking.student.birthDate && (
                      <p className="text-slate-400">
                        Nascimento: {formatDateBrazilian(booking.student.birthDate)}
                      </p>
                    )}
                  </div>

                  {/* Responsável Legal (se houver) */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-pink-400" />
                      <span>Responsável Legal</span>
                    </span>
                    {booking.student.guardian ? (
                      <>
                        <p className="text-sm font-bold text-white">
                          {booking.student.guardian.fullName}
                        </p>
                        <p className="text-slate-400">
                          Parentesco: {booking.student.guardian.relation || 'Responsável'}
                        </p>
                        {booking.student.guardian.cpf && (
                          <p className="text-slate-400">CPF: {booking.student.guardian.cpf}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-400">Aluno maior de idade (próprio responsável)</p>
                    )}
                  </div>

                  {/* Contatos */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-pink-400" />
                      <span>Contatos Cadastrados</span>
                    </span>
                    <p className="text-white">WhatsApp: {booking.student.whatsapp}</p>
                    {booking.student.guardian?.whatsapp && (
                      <p className="text-slate-400">
                        WhatsApp do Resp.: {booking.student.guardian.whatsapp}
                      </p>
                    )}
                    {booking.student.email && (
                      <p className="text-slate-400 truncate">E-mail: {booking.student.email}</p>
                    )}
                  </div>

                  {/* Dados Físicos */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-pink-400" />
                      <span>Calibragem Física & Necessidades</span>
                    </span>
                    <p className="text-white">
                      Altura: <strong>{booking.student.heightCm} cm</strong> | Peso:{' '}
                      <strong>{booking.student.weightKg} kg</strong>
                    </p>
                    {booking.student.hasSpecificNeeds && (
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Observações: {booking.student.specificNeedsDescription || 'Sim'}
                      </p>
                    )}
                  </div>

                  {/* Programa e Local */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-400" />
                      <span>Programa e Local da Aula</span>
                    </span>
                    <p className="text-white font-bold">Programa Aprender a Pedalar</p>
                    <p className="text-slate-400">{meetingLocationTitle}</p>
                    {formattedCep && <p className="text-pink-400">CEP: {formattedCep}</p>}
                  </div>

                  {/* Valor e Informações Contratuais */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-pink-400" />
                      <span>Informações Contratuais</span>
                    </span>
                    <p className="text-emerald-400 font-bold text-sm">
                      Investimento: R$ {(booking.price || 499).toFixed(2).replace('.', ',')} (PIX)
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Política de 24h para remarcações • Metodologia ABCDE
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Registro imutável conforme os termos aceitos no momento da inscrição.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. SEÇÃO: AJUDA E CONTATO */}
          {/* ========================================================= */}
          {activeSection === 'ajuda' && (
            <div className="space-y-6 animate-in fade-in" id="secao-aluno-ajuda">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                    Suporte e Atendimento
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Ajuda e Contato com o Instrutor
                  </h3>
                </div>

                {/* Canal Direto WhatsApp */}
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Atendimento via WhatsApp</h4>
                      <p className="text-xs text-slate-300 font-mono">
                        {OFFICIAL_WHATSAPP_DISPLAY}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Fale diretamente com a equipe do ABC do Pedal para tirar dúvidas sobre seu agendamento, ponto de encontro ou orientações.
                  </p>
                  <a
                    href={`https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Olá instrutor, sou ${booking.student.fullName} (Inscrição #${booking.id.slice(0, 8)}). Gostaria de tirar dúvidas sobre o ABC do Pedal.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir Conversa no WhatsApp</span>
                  </a>
                </div>

                {/* Perguntas Frequentes (FAQ) */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">Perguntas Frequentes</h4>

                  <div className="space-y-2 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <strong className="text-white block font-bold">
                        Como funciona a política de remarcação e cancelamento?
                      </strong>
                      <p className="text-slate-400 font-light leading-relaxed">
                        Remarcações e cancelamentos podem ser realizados sem qualquer custo adicional com antecedência mínima de 24 horas antes do início da aula. Cancelamentos com menos de 24 horas estão sujeitos à taxa de R$ 50,00 para nova reserva de horário.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <strong className="text-white block font-bold">
                        O que devo levar para a aula?
                      </strong>
                      <p className="text-slate-400 font-light leading-relaxed">
                        A bicicleta calibrada para a sua estatura e o capacete higienizado são fornecidos pela ABC do Pedal. Você deve utilizar calçado fechado (tênis), calça esportiva ou bermuda confortável, e trazer uma garrafinha de água.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <strong className="text-white block font-bold">
                        O que é o Método ABCDE?
                      </strong>
                      <p className="text-slate-400 font-light leading-relaxed">
                        É a metodologia exclusiva de ensino do ABC do Pedal, dividida em 5 etapas pedagógicas estruturadas (Autoconhecimento, Base, Controle, Domínio e Excelência), somando 20 habilidades motoras observáveis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAIS OBRIGATÓRIOS PRESERVADOS */}
      {/* ========================================================= */}

      {/* 1. Modal de Remarcação */}
      {showScheduleNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Agendar Próxima Sessão / Remarcar</h3>
              <button
                type="button"
                onClick={() => setShowScheduleNewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Selecione uma nova data e horário disponível. Seus dados cadastrais serão mantidos sem necessidade de novo preenchimento.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const filtered = availableSlots.filter((s) => isSlotMatchingStudentLocation(s, booking?.location));
                if (filtered.length === 0) {
                  return <p className="text-xs text-slate-500 py-4 text-center">Nenhum horário livre para sua região no momento.</p>;
                }
                return filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSlotForNew(s)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedSlotForNew?.id === s.id
                        ? 'bg-pink-950/40 border-pink-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{formatDateBrazilian(s.date)} ({getWeekdayName(s.date)})</p>
                      <p className="text-[11px] text-pink-400 font-mono">
                        {s.time} • 50 minutos {s.locationName ? `• ${s.locationName}` : ''}
                      </p>
                    </div>
                    {selectedSlotForNew?.id === s.id && (
                      <CheckCircle className="w-4 h-4 text-pink-400" />
                    )}
                  </button>
                ));
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowScheduleNewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedSlotForNew}
                onClick={handleScheduleNextSession}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                Confirmar Novo Horário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal de Confirmação de Cancelamento */}
      {showCancelConfirmation && cancellationAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-white text-base">Confirmar Cancelamento?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está cancelando a aula de{' '}
              <strong>{booking.slot?.date ? `${formatDateBrazilian(booking.slot.date)} às ${booking.slot.time}` : 'AGUARDANDO CONFIRMAÇÃO DO INSTRUTOR'}</strong>.
            </p>

            {cancellationAlert.canCancelFree ? (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
                ✓ Cancelamento com mais de 24h de antecedência. Isento de taxa de remarcação.
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300">
                ⚠️ Cancelamento com menos de 24h (faltam {cancellationAlert.hoursLeft}h). Sujeito à taxa de R$ 50,00 para remarcação, conforme política aceita.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Oficial de Certificação do Método ABCDE */}
      {booking && (
        <ConquestCertificateModal
          booking={booking}
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
        />
      )}

      {/* 4. Modal para Visualização do Comprovante do Aluno */}
      {selectedVoucherForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in" id="modal-visualizar-comprovante-aluno">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <h4 className="text-sm font-bold text-white font-mono">
                  {selectedVoucherForView.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedVoucherForView.fileName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucherForView(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-black/80">
              <img
                src={selectedVoucherForView.url}
                alt={selectedVoucherForView.fileName}
                className="max-h-[65vh] max-w-full object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
            </div>
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono bg-slate-950/80">
              <a
                href={selectedVoucherForView.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300 flex items-center gap-1 font-semibold"
              >
                <span>Abrir imagem original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedVoucherForView(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
