import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveCallRecord } from '../services/callRecordService';

// We will define this later
// import { saveCallRecord } from '../services/callRecordService';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ name, label, options, selectedValue, onChange, required = false }) => (
  <div className="mb-6">
    <label className="block mb-2 font-semibold text-brand-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex flex-col gap-2">
      {options.map(option => (
        <label key={option.value} className="flex items-center p-3 rounded-lg bg-softpink-50/60 border-2 border-transparent has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 transition-all cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
            className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300"
            required={required}
          />
          <span className="ml-3 font-medium text-brand-800">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

interface CheckboxGroupProps {
  label: string;
  description?: string;
  options: { value: string; label: string; }[];
  selectedValues: Record<string, boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  max?: number;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, description, options, selectedValues, onChange, required = false, max }) => {
  // Count selected
  const selectedCount = Object.values(selectedValues).filter(v => v === true).length;
  return (
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-brand-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-sm text-gray-500 mb-2 whitespace-pre-line">{description}</p>}
      <div className="flex flex-col gap-2">
        {options.map(option => {
          const checked = selectedValues[option.value] === true ? true : false;
          const disableCheck = Boolean(max && !checked && selectedCount >= max);
          return (
            <label key={option.value} className={`flex items-center p-3 rounded-lg bg-softpink-50/60 border-2 border-transparent has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 transition-all cursor-pointer ${disableCheck ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                name={option.value}
                checked={checked}
                onChange={onChange}
                className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                disabled={disableCheck}
              />
              <span className="ml-3 font-medium text-brand-800">{option.label}</span>
            </label>
          );
        })}
      </div>
      {max && <p className="text-xs text-gray-500 mt-2">Pode selecionar até {max} opções.</p>}
    </div>
  );
};

const initialFormData: {
  listenerId: string;
  callDate: string;
  dayOfWeek: string;
  timeOfCall: string;
  phoneType: string;
  callerSex: string;
  callerSexOther: string;
  callerLocation: string;
  callerAge: string;
  callerAgeOther: string;
  isNewCaller: string;
  isHabitue: string;
  habitueName: string;
  suicidalIdeation: string;
  suicideRisk: Record<string, boolean>;
  isReferral: string;
  referralRequest: string;
  referralRequestOther: string;
  callSummary: string;
  personalReflection: string;
  callDuration: string;
  callThemes: Record<string, boolean>;
  callThemesOther: string;
  isPassive: string;
  passiveListenerId: string;
  passivePersonalReflection: string;
} = {
  listenerId: '',
  callDate: new Date().toISOString().split('T')[0],
  dayOfWeek: '',
  timeOfCall: '',
  phoneType: '',
  callerSex: '',
  callerSexOther: '',
  callerLocation: '',
  callerAge: '',
  callerAgeOther: '',
  isNewCaller: '',
  isHabitue: '',
  habitueName: '',
  suicidalIdeation: '',
  suicideRisk: {
    "Pensamento Suicida": false,
    "Risco Moderado": false,
    "Risco com plano": false,
    "Suicídio Iminente": false,
    "Suicídio em Curso": false
  },
  isReferral: '',
  referralRequest: '',
  referralRequestOther: '',
  callSummary: '',
  personalReflection: '',
  callDuration: '',
  callThemes: {
    "Suicídio e Pensamentos Suicidas": false,
    "Saúde Mental e Sintomas Psicológicos (Ansiedade, ...": false,
    "Saúde física": false,
    "Luto": false,
    "Sociedade e Cultura (Política, Arte, Conflitos geopolí...": false,
    "Quotidiano": false,
    "Educação (Escola, Faculdade)": false,
    "Relações (Amorosas; Familiares; Amizade)": false,
    "Espiritualidade (Religião, Deus)": false,
    "Sexualidade (Orientação Sexual; Sexo; Masturbação)": false,
    "Solidão (Isolamento)": false,
    "Violência (Física, Doméstica, Sexual, Bullying)": false,
    "Silêncio": false,
    "Sem conteúdo": false,
    "Gozo": false,
    "Insultos e Manipulação": false,
    "Desesperança no futuro (Planos de futuro)": false,
    "Vida profissional": false,
    "Outra opção...": false
  },
  callThemesOther: '',
  isPassive: '',
  passiveListenerId: '',
  passivePersonalReflection: ''
};

const CallSheet: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState(() => ({
      ...initialFormData,
      listenerId: user?.idNumber || '',
  }));
  
  // Calculate total steps based on form logic
  const getTotalSteps = () => {
    let steps = 9; // Base steps (1-9 are always shown)
    
    // Add conditional steps based on answers
    if (formData.isNewCaller === 'Não') {
      steps++; // Step 3: Habitué check
      if (formData.isHabitue === 'Sim') {
        steps++; // Step 4: Habitué name
      }
    }
    
    if (formData.isNewCaller === 'Sim' || formData.isHabitue === 'Não') {
      steps++; // Step 5: Suicidal ideation
      if (formData.suicidalIdeation === 'Sim') {
        steps++; // Step 6: Risk assessment
      } else if (formData.suicidalIdeation === 'Não') {
        steps++; // Step 7: Referral
        if (formData.isReferral === 'Sim') {
          steps++; // Step 8: Referral destination
        }
      }
    }
    
    steps++; // Step 10: Themes (always after 9)
    steps++; // Step 11: Passive (always after 10)
    
    if (formData.isPassive === 'Sim') {
      steps++; // Step 12: Passive Details
      steps++; // Step 13: Thank You
    } else if (formData.isPassive === 'Não') {
      steps++; // Step 12: Thank You
    }
    
    return steps;
  };

  const totalSteps = getTotalSteps();

  // Get current section based on form logic
  const getCurrentSection = () => {
    let section = 1;
    let step = 1;
    
    // Section 1: Basic Info (always first)
    if (currentStep === step) return { section: 1, title: "Ficha de Chamada [2024/2025]" };
    step++;
    
    // Section 2: About Caller (always second)
    if (currentStep === step) return { section: 2, title: "Sobre o apelante 🤔" };
    step++;
    
    // Conditional sections based on isNewCaller
    if (formData.isNewCaller === 'Não') {
      if (currentStep === step) return { section: 3, title: "Não é a primeira vez que falamos com este apelante?" };
      step++;
      
      if (formData.isHabitue === 'Sim') {
        if (currentStep === step) return { section: 4, title: "Habemos Habitué" };
        step++;
      }
    }
    
    if (formData.isNewCaller === 'Sim' || formData.isHabitue === 'Não') {
      if (currentStep === step) return { section: 5, title: "Ideação Suicida" };
      step++;
      
      if (formData.suicidalIdeation === 'Sim') {
        if (currentStep === step) return { section: 6, title: "Qual o risco?" };
        step++;
      } else if (formData.suicidalIdeation === 'Não') {
        if (currentStep === step) return { section: 7, title: "Reencaminhamento" };
        step++;
        
        if (formData.isReferral === 'Sim') {
          if (currentStep === step) return { section: 8, title: "Para onde?" };
          step++;
        }
      }
    }
    
    // Section 9: Call Summary (always after conditional sections)
    if (currentStep === step) return { section: 9, title: "Sobre a tua chamada 👋" };
    step++;
    
    // Section 10: Themes (always after 9)
    if (currentStep === step) return { section: 10, title: "Tema/as" };
    step++;
    
    // Section 11: Passive (always after 10)
    if (currentStep === step) return { section: 11, title: "Passiva" };
    step++;
    
    // Section 12: Passive Details or Thank You
    if (formData.isPassive === 'Sim') {
      if (currentStep === step) return { section: 12, title: "Em Passiva" };
      step++;
      if (currentStep === step) return { section: 13, title: "Obrigado" };
      step++;
    } else if (formData.isPassive === 'Não') {
      if (currentStep === step) return { section: 12, title: "Obrigado" };
      step++;
    }
    
    return { section: 1, title: "Ficha de Chamada [2024/2025]" };
  };

  const currentSection = getCurrentSection();

  const handleNext = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    const section = currentSection.section;
    
    switch (section) {
      case 1:
        return formData.dayOfWeek && formData.timeOfCall && formData.phoneType;
      case 2:
        return formData.callerSex && formData.callerAge && formData.isNewCaller;
      case 3:
        return formData.isHabitue;
      case 4:
        return formData.habitueName;
      case 5:
        return formData.suicidalIdeation;
      case 6:
        return Object.values(formData.suicideRisk).some(v => v);
      case 7:
        return formData.isReferral;
      case 8:
        return formData.referralRequest;
      case 9:
        return formData.callSummary && formData.personalReflection && formData.callDuration;
      case 10:
        return Object.values(formData.callThemes).some(v => v);
      case 11:
        return formData.isPassive;
      case 12:
        return formData.passiveListenerId && formData.passivePersonalReflection;
      case 13:
        return true;
      default:
        return true;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      const [group, key] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [group]: {
          ...(prev as any)[group],
          [key]: checked ? true : false,
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Allow submit if on the 'Obrigado' section, not just if currentStep === totalSteps
    if (getCurrentSection().title !== "Obrigado") return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Clean the data before saving - only include selected checkboxes and ensure no undefined values
      
      // Create a clean object without the problematic fields
      const dataToSave = {
        listenerId: formData.listenerId,
        callDate: formData.callDate,
        dayOfWeek: formData.dayOfWeek,
        timeOfCall: formData.timeOfCall,
        phoneType: formData.phoneType,
        callerSex: formData.callerSex,
        callerSexOther: formData.callerSexOther,
        callerLocation: formData.callerLocation,
        callerAge: formData.callerAge,
        callerAgeOther: formData.callerAgeOther,
        isNewCaller: formData.isNewCaller,
        isHabitue: formData.isHabitue,
        habitueName: formData.habitueName,
        suicidalIdeation: formData.suicidalIdeation,
        isReferral: formData.isReferral,
        referralRequest: formData.referralRequest,
        referralRequestOther: formData.referralRequestOther,
        callSummary: formData.callSummary,
        personalReflection: formData.personalReflection,
        callDuration: formData.callDuration,
        callThemesOther: formData.callThemesOther,
        isPassive: formData.isPassive,
        passiveListenerId: formData.passiveListenerId,
        passivePersonalReflection: formData.passivePersonalReflection,
        suicideRisk: Object.entries(formData.suicideRisk || {})
          .filter(([,v]) => v === true)
          .map(([k]) => k),
        callThemes: Object.entries(formData.callThemes || {})
          .filter(([,v]) => v === true)
          .map(([k]) => k),
        submittedBy: user?.uid,
        submittedAt: new Date().toISOString(),
      };

      await saveCallRecord(dataToSave);
      setSubmitSuccess(true);
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
      }, 2000); // Wait 2 seconds to show success message, then reset
    } catch (error) {
      setSubmitError('Ocorreu um erro ao submeter a ficha. Por favor, tente novamente.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...initialFormData, listenerId: user?.idNumber || '' });
    setCurrentStep(1);
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const renderStep = () => {
    const section = currentSection.section;
    
    switch (section) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold text-brand-700 mb-2">Ficha de Chamada [2024/2025]</h2>
            <p className="text-sm text-gray-500 mb-6">Todas as chamadas recebidas têm de ser preenchidas !!!</p>
            <div className="mb-6">
                <label className="block mb-1 font-semibold text-brand-700">Numero de escutante 📞 <span className="text-red-500">*</span></label>
                <input type="text" name="listenerId" value={formData.listenerId} readOnly className="w-full px-4 py-2 rounded-lg border border-brand-200 bg-gray-100 cursor-not-allowed" />
            </div>
            <div className="mb-6">
                <label htmlFor="callDate" className="block mb-1 font-semibold text-brand-700">Data 📅 <span className="text-red-500">*</span></label>
                <DatePicker id="callDate" selected={formData.callDate ? new Date(formData.callDate) : new Date()} onChange={(date: Date | null) => setFormData(prev => ({...prev, callDate: date?.toISOString().split('T')[0] || ''}))} dateFormat="dd/MM/yyyy" className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required />
            </div>
            <RadioGroup name="dayOfWeek" label="Dia da semana" required={true} options={["2ª feira", "3ª feira", "4ª feira", "5ª feira", "6ª feira", "Sábado", "Domingo"].map(v => ({value:v, label:v}))} selectedValue={formData.dayOfWeek} onChange={handleChange} />
            <RadioGroup name="timeOfCall" label="Hora em que ocorreu a chamada" required={true} options={["20h - 21h", "21h - 22h", "22h - 23h", "23h - 00h", "00h - 01h"].map(v => ({value:v, label:v}))} selectedValue={formData.timeOfCall} onChange={handleChange} />
            <RadioGroup name="phoneType" label="Telefone" required={true} options={["Fixo", "Móvel"].map(v => ({value:v, label:v}))} selectedValue={formData.phoneType} onChange={handleChange} />
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold text-brand-700 mb-2">Sobre o apelante 🤔</h2>
            <RadioGroup name="callerSex" label="Sexo do apelante" required={true} options={["Feminino", "Masculino", "Não aplicável", "Outra opção..."].map(v => ({value:v, label:v}))} selectedValue={formData.callerSex} onChange={handleChange} />
            {formData.callerSex === 'Outra opção...' && (<div className="mb-6 -mt-4 pl-6"><input type="text" name="callerSexOther" placeholder="Por favor especifique" value={formData.callerSexOther} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required /></div>)}
            <div className="mb-6">
              <label className="block mb-1 font-semibold text-brand-700">Localidade</label>
              <p className="text-xs text-gray-500 mb-2">(Caso não saibas, não preenchas)</p>
              <input type="text" name="callerLocation" value={formData.callerLocation} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" />
            </div>
            <RadioGroup name="callerAge" label="Idade" required={true} options={["Infantil (0 - 12)", "Adolescente (13 - 17)", "Jovem Adulto (18 - 35)", "Adulto (36 - 64)", "Idoso (&gt; 65)", "Não aplicável", "Outra opção..."].map(v => ({value:v, label:v}))} selectedValue={formData.callerAge} onChange={handleChange} />
            {formData.callerAge === 'Outra opção...' && (<div className="mb-6 -mt-4 pl-6"><input type="text" name="callerAgeOther" placeholder="Por favor especifique" value={formData.callerAgeOther} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required /></div>)}
            <RadioGroup name="isNewCaller" label="É um novo apelante?" required={true} options={["Sim", "Não"].map(v => ({value:v, label:v}))} selectedValue={formData.isNewCaller} onChange={handleChange} />
          </div>
        );
      case 3:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Não é a primeira vez que falamos com este apelante?</h2>
                <RadioGroup name="isHabitue" label="Habitué?" required={true} options={["Sim", "Não"].map(v => ({value:v, label:v}))} selectedValue={formData.isHabitue} onChange={handleChange} />
            </div>
        );
      case 4:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Habemos Habitué</h2>
                <RadioGroup name="habitueName" label="Apelante 🙏" required={true} options={["Açoriano", "Date Do Lidl", "Jeová", "Michelle Tu va Tomber", "Ostracizado", "Procrastinador", "Sr. Estudante", "+ 18", "+ 18 2.0"].map(v => ({value:v, label:v}))} selectedValue={formData.habitueName} onChange={handleChange} />
            </div>
        );
      case 5:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Ideação Suicida</h2>
                <RadioGroup name="suicidalIdeation" label="Pergunta" required={true} options={["Sim", "Não"].map(v => ({value:v, label:v}))} selectedValue={formData.suicidalIdeation} onChange={handleChange} />
            </div>
        );
       case 6:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Qual o risco?</h2>
                <CheckboxGroup label="Pergunta" required={true} options={["Pensamento Suicida", "Risco Moderado", "Risco com plano", "Suicídio Iminente", "Suicídio em Curso"].map(v => ({value:v, label:v}))} selectedValues={formData.suicideRisk} onChange={e => {
                  const { name, checked } = e.target;
                  setFormData(prev => ({
                    ...prev,
                    suicideRisk: {
                      ...prev.suicideRisk,
                      [name]: checked
                    }
                  }));
                }} max={5} />
            </div>
        );
      case 7:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Reencaminhamento</h2>
                <RadioGroup name="isReferral" label="Pergunta" required={true} options={["Sim", "Não"].map(v => ({value:v, label:v}))} selectedValue={formData.isReferral} onChange={handleChange} />
            </div>
        );
      case 8:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Para onde?</h2>
                <RadioGroup name="referralRequest" label="Pedido de Reencaminhamento" required={true} options={["Emergência e Saúde", "Apoio Emocional", "Apoio Social", "Apoio Jovem e Sexualidade", "Hospitais", "Outra opção..."].map(v => ({value:v, label:v}))} selectedValue={formData.referralRequest} onChange={handleChange} />
                {formData.referralRequest === 'Outra opção...' && (<div className="mb-6 -mt-4 pl-6"><input type="text" name="referralRequestOther" placeholder="Por favor especifique" value={formData.referralRequestOther} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required /></div>)}
            </div>
        );
      case 9:
          return (
              <div>
                  <h2 className="text-xl font-bold text-brand-700 mb-6">Sobre a tua chamada 👋</h2>
                  <div className="mb-6">
                      <label className="block mb-2 font-semibold text-brand-700">Resumo da chamada <span className="text-red-500">*</span></label>
                      <textarea name="callSummary" value={formData.callSummary} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400 min-h-[120px]" required />
                  </div>
                  <div className="mb-6">
                      <label className="block mb-2 font-semibold text-brand-700">Reflexão pessoal 💭 <span className="text-red-500">*</span></label>
                      <textarea name="personalReflection" value={formData.personalReflection} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400 min-h-[120px]" required />
                  </div>
                  <div className="mb-6">
                      <label className="block mb-2 font-semibold text-brand-700">Duração da chamada (minutos)⏰ <span className="text-red-500">*</span></label>
                      <input type="number" min="1" step="1" pattern="[0-9]+" name="callDuration" value={formData.callDuration} onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData(prev => ({ ...prev, callDuration: val }));
                      }} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required />
                  </div>
              </div>
          );
      case 10:
        const themeOptions = [
          "Suicídio e Pensamentos Suicidas", "Saúde Mental e Sintomas Psicológicos (Ansiedade, ...", "Saúde física", "Luto", "Sociedade e Cultura (Política, Arte, Conflitos geopolí...",
          "Quotidiano", "Educação (Escola, Faculdade)", "Relações (Amorosas; Familiares; Amizade)", "Espiritualidade (Religião, Deus)", "Sexualidade (Orientação Sexual; Sexo; Masturbação)",
          "Solidão (Isolamento)", "Violência (Física, Doméstica, Sexual, Bullying)", "Silêncio", "Sem conteúdo", "Gozo", "Insultos e Manipulação", "Desesperança no futuro (Planos de futuro)",
          "Vida profissional", "Outra opção..."
        ].map(v => ({value: v, label: v}));
        return (
          <div>
            <h2 className="text-xl font-bold text-brand-700 mb-2">Tema/as</h2>
            <CheckboxGroup 
              label="" 
              options={themeOptions} 
              required={true} 
              selectedValues={formData.callThemes} 
              max={3}
              onChange={e => {
                const { name, checked } = e.target;
                setFormData(prev => ({
                  ...prev,
                  callThemes: {
                    ...prev.callThemes,
                    [name]: checked
                  }
                }));
              }} 
            />
            {formData.callThemes['Outra opção...' as keyof typeof formData.callThemes] && (
              <div className="mb-6 -mt-4 pl-6">
                <input type="text" name="callThemesOther" placeholder="Por favor especifique" value={formData.callThemesOther} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required />
              </div>
            )}
          </div>
        );
      case 11:
        return (
            <div>
                <h2 className="text-xl font-bold text-brand-700 mb-2">Passiva</h2>
                <RadioGroup name="isPassive" label="Passiva (Se estavas acompanhado/a na sala)" required={true} options={["Sim", "Não"].map(v => ({value:v, label:v}))} selectedValue={formData.isPassive} onChange={handleChange} />
            </div>
        );
      case 12:
        if (formData.isPassive === 'Sim') {
          return (
              <div>
                  <h2 className="text-xl font-bold text-brand-700 mb-2">Em Passiva</h2>
                  <div className="mb-6">
                      <label className="block mb-2 font-semibold text-brand-700">Número do escutante <span className="text-red-500">*</span></label>
                      <input type="text" name="passiveListenerId" value={formData.passiveListenerId} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400" required />
                  </div>
                  <div className="mb-6">
                      <label className="block mb-2 font-semibold text-brand-700">Reflexão pessoal <span className="text-red-500">*</span></label>
                      <textarea name="passivePersonalReflection" value={formData.passivePersonalReflection} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400 min-h-[120px]" required />
                  </div>
              </div>
          );
        } else {
          // If 'Não', this is the Thank You section
          return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-success mb-4">Obrigado pelo preenchimento!</h2>
                <p className="text-brand-700">A tua ficha está pronta para ser submetida.</p>
                <button 
                  type="submit" 
                  className="mt-6 px-6 py-2 rounded-full font-bold text-white bg-green-600 hover:bg-green-700 transition flex items-center gap-2 mx-auto" 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>}
                  {isSubmitting ? 'A submeter...' : 'Submeter'}
                </button>
            </div>
          );
        }
      case 13:
        // Only shown if Passiva === 'Sim' (after Em Passiva)
        return (
          <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-success mb-4">Obrigado pelo preenchimento!</h2>
              <p className="text-brand-700">A tua ficha está pronta para ser submetida.</p>
              <button 
                type="submit" 
                className="mt-6 px-6 py-2 rounded-full font-bold text-white bg-green-600 hover:bg-green-700 transition flex items-center gap-2 mx-auto" 
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>}
                {isSubmitting ? 'A submeter...' : 'Submeter'}
              </button>
          </div>
        );
      default:
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-success mb-4">Ficha Submetida com Sucesso!</h2>
                <p className="text-brand-700">Obrigado pela sua dedicação e pelo preenchimento cuidado.</p>
                <button
                    onClick={resetForm}
                    className="mt-6 px-6 py-2 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition"
                >
                    Preencher Nova Ficha
                </button>
            </div>
        );
    }
  };

  if (submitSuccess) {
    return (
        <div className="min-h-screen bg-softpink-100 p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-3xl shadow-glass p-8 space-y-6">
                {renderStep()}
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-softpink-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-3xl shadow-glass p-8 space-y-6">
        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>

        <div className="flex justify-between items-center pt-6 border-t border-brand-100">
          <div>
            <p className="text-sm font-bold text-brand-600">Secção {currentStep} de {totalSteps}</p>
          </div>
          <div className="flex gap-4">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="px-6 py-2 rounded-full font-bold text-brand-700 bg-softpink-100 border border-brand-200 hover:bg-brand-100 transition">Voltar</button>
            )}
            {/* Only show Continue button if not on Thank You section */}
            {(getCurrentSection().title !== "Obrigado") && (
              <button 
                type="button" 
                onClick={handleNext} 
                disabled={!validateCurrentStep()}
                className="px-6 py-2 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            )}
          </div>
        </div>
        {submitError && <div className="mt-4 text-center text-red-500 font-semibold">{submitError}</div>}
      </div>
    </div>
  );
};

export default CallSheet; 