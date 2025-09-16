import clsx from 'clsx';

interface AnswerCardProps {
  text: string;
  keywords: string[];
  onBrailleOutput: (keywords: string[]) => void;
  className?: string;
}

export function AnswerCard({ 
  text, 
  keywords, 
  onBrailleOutput, 
  className = "" 
}: AnswerCardProps) {
  const hasKeywords = keywords && keywords.length > 0;

  return (
    <div className={clsx(
      "bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg",
      className
    )}>
      {/* 답변 텍스트 */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed text-[15px] whitespace-pre-wrap">
          {text}
        </p>
      </div>

      {/* 키워드 미리보기 */}
      {hasKeywords && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              핵심 키워드
            </span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {keywords.length}개
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 3).map((keyword, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
              >
                {keyword}
              </span>
            ))}
            {keywords.length > 3 && (
              <span className="text-xs text-gray-400 px-2 py-1">
                +{keywords.length - 3}개 더
              </span>
            )}
          </div>
        </div>
      )}

      {/* 점자 출력 버튼 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onBrailleOutput(keywords)}
          disabled={!hasKeywords}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
            hasKeywords
              ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
          aria-label={`${keywords.join(", ")} 키워드 점자 출력`}
        >
          <span className="text-sm">⠠⠃</span>
          <span>점자 출력</span>
          {hasKeywords && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              {keywords.length}
            </span>
          )}
        </button>

        {/* 상태 표시 */}
        {hasKeywords && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>출력 준비됨</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnswerCard;
