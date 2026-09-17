import { publicContent } from '../data/content'
import { FadeIn } from './FadeIn'

export function ExperienceSection() {
  const { education, internships } = publicContent
  const orderedInternships = [...internships].sort((a, b) => a.order - b.order)

  return (
    <section
      className="experience-editorial"
      id="experience"
      aria-labelledby="experience-title"
    >
      <div className="experience-editorial__heading">
        <FadeIn y={44}>
          <p className="section-kicker">EXPERIENCE / EDUCATION</p>
          <h2 id="experience-title">Where I<br />have worked.</h2>
        </FadeIn>
        <p>
          两段实习分别覆盖售前与研发：一段做客户需求沟通、方案文档与问题闭环，一段按业务方需求开发 AI 业务系统。
        </p>
      </div>

      <ol className="experience-list">
        {orderedInternships.map((internship, index) => (
          <FadeIn
            className="experience-item"
            y={38}
            delay={index * 0.08}
            key={internship.id}
          >
            <li>
              <div className="experience-item__head">
                <div>
                  <h3>{internship.company}</h3>
                  <p>{internship.role}</p>
                </div>
                <span className="experience-item__period">{internship.period}</span>
              </div>
              <ul className="experience-item__highlights">
                {internship.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          </FadeIn>
        ))}
      </ol>

      <FadeIn className="education-card" y={38}>
        <div className="education-card__head">
          <div>
            <h3>{education.school}</h3>
            <p>
              {education.major} ｜ {education.degree}
            </p>
          </div>
          <span className="education-card__period">{education.period}</span>
        </div>
        <ul className="education-card__courses">
          {education.courses.map((course) => (
            <li key={course}>{course}</li>
          ))}
        </ul>
      </FadeIn>
    </section>
  )
}
