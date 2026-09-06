import { useEffect, useState } from "react";
import { ArrowRight, Check, ListTodo, Sparkles, X } from "lucide-react";
import { storage } from "../platform/storage";

const starterTasks = [
  { text: "Разобрать входящие задачи", selected: true },
  { text: "Запланировать главную цель дня", selected: true },
  { text: "Сделать короткий перерыв", selected: false },
];

export const onboardingKeyFor = (user) => `focus_onboarding_v1:${user.id}`;

export default function Onboarding({ user, taskCount, onCreate }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [items, setItems] = useState(starterTasks);

  useEffect(() => {
    if (user && taskCount === 0 && !storage.getItem(onboardingKeyFor(user))) setOpen(true);
  }, [taskCount, user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    window.setTimeout(() => document.querySelector(".onboardingPrimary")?.focus(), 0);
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      storage.setItem(onboardingKeyFor(user), "done");
      setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, user]);

  if (!open) return null;
  const finish = async () => {
    for (const item of items.filter((item) => item.selected)) await onCreate({ text: item.text, dueDate: "", priority: "none" });
    storage.setItem(onboardingKeyFor(user), "done");
    setOpen(false);
  };
  const skip = () => { storage.setItem(onboardingKeyFor(user), "done"); setOpen(false); };

  return <div className="onboardingLayer"><section className="onboardingDialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><button className="onboardingClose" aria-label="Пропустить знакомство" onClick={skip}><X size={19} /></button>{step === 0 ? <><span className="onboardingIcon"><Sparkles size={25} /></span><p className="onboardingStep">Шаг 1 из 2</p><h2 id="onboarding-title">Начнем с понятного плана</h2><p>Focus помогает быстро записать задачу, выбрать срок и спокойно двигаться по списку.</p><button className="onboardingPrimary" onClick={() => setStep(1)}>Настроить первые задачи<ArrowRight size={17} /></button></> : <><span className="onboardingIcon"><ListTodo size={25} /></span><p className="onboardingStep">Шаг 2 из 2</p><h2 id="onboarding-title">Добавить стартовые задачи</h2><p>Выберите полезные пункты. Их можно изменить или удалить в любой момент.</p><div className="starterTasks">{items.map((item, index) => <button aria-pressed={item.selected} key={item.text} onClick={() => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, selected: !entry.selected } : entry))}><span>{item.selected && <Check size={14} />}</span>{item.text}</button>)}</div><button className="onboardingPrimary" onClick={finish}>Готово</button></>}</section></div>;
}
