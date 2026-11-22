# RETROSPECTIVE (Team 10)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 2 vs 2
- Total points committed vs done : 18 vs 18
- Nr of hours planned vs spent (as a team) : 82h vs 70h10m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed
- Related documentation is recorded

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
| ----- | ------- | ------ | ---------- | ------------ |
| _#0_  | 8       | -      | 62         | 43h25m       |
| #1    | 7       | 13     | 9          | 15h10m       |
| #2    | 6       | 5      | 10h30m     | 11h35m       |

- Hours per task <span style="color:red">per person</span> (average, standard deviation)

| Member                     | Spent Time | #Tasks |  AVG  | StDev |
| :------------------------- | :--------: | :----: | :---: | :---: |
| Alexandru Marian Cojocariu |    17h     |   16   | 1.06h | 0.61h |
| Cristiano Berardo          |    22h     |   24   | 0.92h | 0.46h |
| Germana Liseo              |   14.67h   |   13   | 1.13h | 0.59h |
| Isabella Ilaria Favero     |   16.5h    |   19   | 0.87h | 0.43h |
| Jun Ran Mao                |     0h     |   0    |  0h   |  0h   |

|                            |  AVG  |  std  |
| :------------------------- | :---: | :---: |
| **Total group spent time** | 0.94h | 0.52h |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1
  $$\frac{\sum_i estimation_{task_i}}{\sum_i spent_{task_i}} - 1 = \frac{82}{70.16} - 1= 0.17$$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 2h
  - Total hours spent: 2h30m
  - Nr of automated unit test cases: 17
- Integration testing:
  - Total hours estimated: 2h
  - Total hours spent: 2h40m
- E2E testing:
  - Total hours estimated: 2h
  - Total hours spent: 2h30m
- Code review:
  - Total hours estimated: 5h
  - Total hours spent: 6h15m

## ASSESSMENT

- What caused your errors in estimation (if any)?

  - The main cause of the estimation errors was Jun Ran Mao's absence, which led to a redistribution of tasks among the other team members.

- What lessons did you learn (both positive and negative) in this sprint?

  - Positive: Estimate more time and with more fine granularity helped us to better understand the complexity of the tasks
  - Negative: The lack of communication and coordination among team members led to some misunderstandings and delays.

- Which improvement goals set in the previous retrospective were you able to achieve?

  - Meeting more frequently during the start of the sprint to synchronize the team
  - End the sprint with all stories completed 2 days before the end of the sprint

- Which ones you were not able to achieve? Why?

  - Punctuality is not always respected, mostly due to different personal schedules and varying availability

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  - Better use of github workflow to be able to track deployable code with version
  - All the team should maintain a pace of roughly 8 hours per week per member by picking up tasks early in the sprint
  - Need to learn how to use the AI to not commit some mistakes

- One thing you are proud of as a Team!!

  - We are proud of the fact that we were able to complete all the stories in the sprint, despite the challenges we faced.
