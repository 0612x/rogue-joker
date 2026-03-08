/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import GameBoard from '@/components/GameBoard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <GameBoard />
    </div>
  );
}
