import React from 'react';

const Character = () => {

    return (
        <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40">
            <img 
                src="https://cdn.sanity.io/images/do2rqv0h/production/3356021b2d743e60cb89b0b97196fb2b2b0b44a0-800x800.gif?w=1116&fit=max&auto=format" 
                alt="Study Companion" 
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default Character;
