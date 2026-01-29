import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Heart } from 'lucide-react';

export default function SplashPage() {
  return (
    <div className="h-screen bg-white text-gray-900 overflow-hidden flex flex-col items-center justify-center relative">
      
      {/* Main Content: Centered & Focused */}
      <main className="flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8 animate-fade-in-up">
            <MapPin className="h-3 w-3" />
            <span>Built for Hither Green</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1] animate-fade-in-up delay-100">
          Anonymously report issues <br className="hidden md:block" /> 
          <span className="text-gray-400">— effortlessly.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 font-medium mb-10 max-w-2xl leading-tight animate-fade-in-up delay-200">
          Sick of sending emails that go nowhere? 🙄
          <span className="block mt-4">
            We all know the effort that goes into reporting only for it to fall on deaf ears. Our platform makes reporting effortless—creating the visibility and solid evidence base needed to drive the accountability and change for a better Hither Green.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-in-up delay-300">
          <Link
            to="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-black text-white text-lg font-bold px-10 py-5 rounded-2xl hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-200"
          >
            Start a Report <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Playful Footer elements */}
        <div className="mt-16 flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-400 animate-fade-in-up delay-500">
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Fast</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Anonymous</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>Data-Driven</span>
            </div>
        </div>
      </main>

      {/* Very subtle footer note */}
      <footer className="absolute bottom-6 text-center w-full animate-fade-in delay-700">
         <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-gray-300">
            <Heart className="h-3 w-3 text-red-300 fill-red-300 opacity-50" />
            <span>A community project.</span>
         </div>
      </footer>
    </div>
  );
}
