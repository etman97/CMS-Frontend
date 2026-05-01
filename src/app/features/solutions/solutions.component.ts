import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-solutions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './solutions.component.html',
  styleUrl: './solutions.component.scss'
})
export class SolutionsComponent implements OnInit, OnDestroy {
  private dirObserver: MutationObserver | null = null;

  discoverSolutionsTitle = 'Discover Our Solutions';

  ngOnInit(): void {
    this.applyCurrentLanguage();
    this.dirObserver = new MutationObserver(() => this.applyCurrentLanguage());
    this.dirObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir']
    });
  }

  ngOnDestroy(): void {
    this.dirObserver?.disconnect();
    this.dirObserver = null;
  }

  private applyCurrentLanguage(): void {
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    this.discoverSolutionsTitle = isRtl ? 'اكتشف حلولنا' : 'Discover Our Solutions';
  }
}
