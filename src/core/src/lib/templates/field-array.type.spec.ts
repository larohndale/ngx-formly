import { TestBed } from '@angular/core/testing';
import { createGenericTestComponent } from '../test-utils';
import { Component, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule, FormlyForm } from '@ngx-formly/core';
import { FieldArrayType } from './field-array.type';
import { FormlyFieldText } from '../components/formly.field.spec';

function createFormlyTestComponent() {
  return createGenericTestComponent('<formly-form [form]="form" [fields]="fields" [model]="model" [options]="options"></formly-form>', TestComponent);
}

let app: any;
describe('Array Field Type', () => {
  beforeEach(() => {
    app = {
      form: new FormGroup({}),
      model: {},
    };
    TestBed.configureTestingModule({
      declarations: [TestComponent, ArrayTypeComponent, FormlyFieldText],
      imports: [
        ReactiveFormsModule,
        FormlyModule.forRoot({
          types: [
            {
                name: 'input',
                component: FormlyFieldText,
            },
            {
              name: 'array',
              component: ArrayTypeComponent,
            },
          ],
        }),
      ],
    });
  });

  it('should work with nullable model', () => {
    app.model = { array: null };
    app.fields = [{
      key: 'array',
      type: 'array',
    }];

    const fixture = createFormlyTestComponent();
    expect(app.fields[0].fieldGroup).toEqual([]);
    expect(app.fields[0].model).toBeNull();

    fixture.nativeElement.querySelector('#add').click();
    fixture.detectChanges();

    expect(app.fields[0].fieldGroup.length).toEqual(1);
    expect(app.fields[0].model.length).toBe(1);
  });

  it('should keep formControl instance on remove item for repeat section', () => {
    app.model = { foo: [1, 2] };
    app.fields = [{
      key: 'foo',
      type: 'array',
      fieldArray: { type: 'input' },
    }];

    const fixture = createFormlyTestComponent();
    const formArray = app.fields[0].formControl;

    const formControl = formArray.at(1);
    fixture.nativeElement.querySelector('#remove-0').click();
    fixture.detectChanges();

    expect(formArray.controls.length).toEqual(1);
    expect(formArray.at(0)).toEqual(formControl);
  });

  it('should emit `modelChange` on model change', () => {
    app.fields = [{
      key: 'foo',
      type: 'array',
      fieldArray: {
        fieldGroup: [{
          key: 'title',
          type: 'input',
        }],
      },
    }];

    const fixture = createFormlyTestComponent();
    const spy = jasmine.createSpy('model change spy');
    const subscription = fixture.componentInstance.formlyForm.modelChange.subscribe(spy);
    fixture.nativeElement.querySelector('#add').click();
    fixture.detectChanges();

    app.form.get('foo').at(0).get('title').patchValue('***');

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ foo: [{}] });
    expect(spy).toHaveBeenCalledWith({ foo: [{ title: '***' }] });
    expect(app.model).toEqual({ foo: [{ title: '***' }] });

    fixture.nativeElement.querySelector('#remove-0').click();
    expect(app.model).toEqual({ foo: [] });

    subscription.unsubscribe();
  });
});

@Component({ selector: 'formly-form-test', template: '', entryComponents: [] })
class TestComponent {
  @ViewChild(FormlyForm) formlyForm: FormlyForm;

  fields = app.fields;
  form: FormGroup = app.form;
  model = app.model;
  options = app.options;
}

@Component({
  selector: 'formly-array-type',
  template: `
    <div *ngFor="let field of field.fieldGroup; let i = index;">
      <formly-group [field]="field"></formly-group>
      <button [id]="'remove-' + i" type="button" (click)="remove(i)">Remove</button>
    </div>
    <button id="add" type="button" (click)="add()">Add</button>
  `,
})
class ArrayTypeComponent extends FieldArrayType {}