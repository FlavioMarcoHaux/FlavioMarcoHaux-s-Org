import React from 'react';
import { Sun } from 'lucide-react';

const PrayerPills: React.FC = () => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center glass-pane rounded-2xl animate-fade-in">
            <Sun className="w-20 h-20 text-yellow-400 mb-6" />
            <h2 className="text-3xl font-bold text-yellow-300">Pílulas de Oração</h2>
            <p className="text-gray-400 mt-4 max-w-md">
                Em breve: Receba pequenas doses de inspiração e fé para iluminar o seu dia. Orações curtas e poderosas para momentos de necessidade.
            </p>
        </div>
    );
};

export default PrayerPills;
